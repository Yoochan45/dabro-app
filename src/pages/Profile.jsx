import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient'; // <<-- Revisi: Impor Supabase
import { v4 as uuidv4 } from 'uuid'; // <<-- Tambahan: Untuk nama file unik

const Profile = () => {
  const { user, isAdmin, isWali } = useAuth();
  const [profile, setProfile] = useState(null);
  const [children, setChildren] = useState([]);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Memastikan user sudah ada sebelum memuat data
    if (user) {
      loadProfile();
      if (isWali()) {
        loadChildren();
      }
    }
  }, [user]);

  // <<-- Revisi: Menggunakan Supabase untuk memuat profil
  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      
      setProfile(data);
      setFormData(data);
    } catch (error) {
      console.error('Error loading profile:', error.message);
    } finally {
      setLoading(false);
    }
  };

  // <<-- Revisi: Menggunakan Supabase untuk memuat data santri anak
  const loadChildren = async () => {
    try {
      // Asumsi ada kolom 'wali_id' di tabel santri yang merujuk ke 'id' di tabel profiles
      const { data, error } = await supabase
        .from('santri')
        .select('*')
        .eq('wali_id', user.id);
      
      if (error) throw error;
      
      setChildren(data);
    } catch (error) {
      console.error('Error loading children:', error.message);
    }
  };

  const handleChange = (e) => {
    if (e.target.name === 'foto') {
      const file = e.target.files[0];
      setFormData({
        ...formData,
        foto_file: file // Menggunakan nama state yang berbeda untuk file
      });
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
  };

  // <<-- Revisi: Mengganti fetch dengan Supabase Storage & Database
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let fotoUrl = formData.foto_url;

      // Unggah foto jika ada file baru
      if (formData.foto_file) {
        const file = formData.foto_file;
        const fileName = `${uuidv4()}-${file.name}`;
        const filePath = `avatars/${user.id}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars') // Nama bucket di Supabase Storage
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);
        
        fotoUrl = publicUrl;
      }

      // Perbarui data profil di database
      const updateData = {
        nama: formData.nama,
        email: formData.email,
        no_hp: formData.no_hp,
        foto_url: fotoUrl, // Menggunakan URL dari Supabase Storage
      };
      
      if (isWali()) {
          updateData.alamat = formData.alamat;
      }
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      await loadProfile();
      setEditing(false);
      alert('Profil berhasil diupdate!');
    } catch (error) {
      console.error('Error updating profile:', error.message);
      alert('Gagal update profil: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row">
        <div className="col-lg-8 mx-auto">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <div className="d-flex justify-content-between align-items-center">
                <h4 className="mb-0">
                  <i className="bi bi-person-circle me-2"></i>
                  Profil {isAdmin() ? 'Admin' : 'Wali Santri'}
                </h4>
                {!editing && (
                  <button 
                    className="btn btn-light btn-sm"
                    onClick={() => setEditing(true)}
                  >
                    <i className="bi bi-pencil"></i> Edit
                  </button>
                )}
              </div>
            </div>
            
            <div className="card-body">
              {editing ? (
                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-4 text-center mb-3">
                      <div className="mb-3">
                        {profile?.foto_url ? (
                          <img 
                            src={profile.foto_url}
                            alt="Profile"
                            className="rounded-circle"
                            style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                          />
                        ) : (
                          <i className="bi bi-person-circle" style={{ fontSize: '150px' }}></i>
                        )}
                      </div>
                      <input
                        type="file"
                        name="foto"
                        className="form-control"
                        accept="image/*"
                        onChange={handleChange}
                      />
                    </div>
                    
                    <div className="col-md-8">
                      <div className="mb-3">
                        <label className="form-label">Nama Lengkap</label>
                        <input
                          type="text"
                          name="nama"
                          className="form-control"
                          value={formData.nama || ''}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          name="email"
                          className="form-control"
                          value={formData.email || ''}
                          onChange={handleChange}
                          required
                          disabled // Email tidak bisa diubah
                        />
                      </div>
                      
                      <div className="mb-3">
                        <label className="form-label">No. HP</label>
                        <input
                          type="tel"
                          name="no_hp"
                          className="form-control"
                          value={formData.no_hp || ''}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      
                      {isWali() && (
                        <div className="mb-3">
                          <label className="form-label">Alamat</label>
                          <textarea
                            name="alamat"
                            className="form-control"
                            rows="3"
                            value={formData.alamat || ''}
                            onChange={handleChange}
                            required
                          ></textarea>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="d-flex gap-2">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => {
                        setEditing(false);
                        setFormData(profile);
                      }}
                    >
                      Batal
                    </button>
                  </div>
                </form>
              ) : (
                <div className="row">
                  <div className="col-md-4 text-center mb-3">
                    {profile?.foto_url ? (
                      <img 
                        src={profile.foto_url}
                        alt="Profile"
                        className="rounded-circle"
                        style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                      />
                    ) : (
                      <i className="bi bi-person-circle" style={{ fontSize: '150px' }}></i>
                    )}
                  </div>
                  
                  <div className="col-md-8">
                    <table className="table table-borderless">
                      <tbody>
                        <tr>
                          <td><strong>Nama:</strong></td>
                          <td>{profile?.nama}</td>
                        </tr>
                        <tr>
                          <td><strong>Email:</strong></td>
                          <td>{profile?.email}</td>
                        </tr>
                        <tr>
                          <td><strong>No. HP:</strong></td>
                          <td>{profile?.no_hp}</td>
                        </tr>
                        <tr>
                          <td><strong>Role:</strong></td>
                          <td>
                            <span className={`badge ${isAdmin() ? 'bg-danger' : 'bg-primary'}`}>
                              {isAdmin() ? 'Administrator' : 'Wali Santri'}
                            </span>
                          </td>
                        </tr>
                        {isWali() && (
                          <tr>
                            <td><strong>Alamat:</strong></td>
                            <td>{profile?.alamat}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Children Info for Wali */}
          {isWali() && children.length > 0 && (
            <div className="card mt-4">
              <div className="card-header bg-success text-white">
                <h5 className="mb-0">
                  <i className="bi bi-people me-2"></i>
                  Data Santri
                </h5>
              </div>
              <div className="card-body">
                <div className="row">
                  {children.map((child) => (
                    <div key={child.id} className="col-md-6 mb-3">
                      <div className="card">
                        <div className="card-body">
                          <div className="d-flex align-items-center">
                            <i className="bi bi-person-circle fs-1 me-3"></i>
                            <div>
                              <h6 className="card-title mb-1">{child.nama}</h6>
                              <p className="card-text small text-muted mb-1">
                                <i className="bi bi-calendar"></i> {new Date(child.tgl_lahir).toLocaleDateString('id-ID')}
                              </p>
                              <p className="card-text small text-muted mb-1">
                                <i className="bi bi-geo-alt"></i> {child.alamat}
                              </p>
                              <p className="card-text small">
                                <span className="badge bg-primary">{child.kelas}</span>
                                <span className="badge bg-secondary ms-1">{child.kamar}</span>
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;