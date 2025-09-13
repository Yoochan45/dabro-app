import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../services/supabaseClient'; // <<-- Revisi: Impor Supabase
import { v4 as uuidv4 } from 'uuid'; // <<-- Tambahan: Untuk nama file unik

const Register = () => {
  const [formData, setFormData] = useState({
    nama: '',
    email: '',
    no_hp: '',
    password: '',
    confirmPassword: '',
    alamat: '',
    foto: null,
    nama_anak: '',
    tgl_lahir_anak: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    if (e.target.name === 'foto') {
      const file = e.target.files[0];
      setFormData({
        ...formData,
        foto: file
      });
      
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreview(null);
      }
    } else {
      setFormData({
        ...formData,
        [e.target.name]: e.target.value
      });
    }
    setError('');
  };

  // <<-- Revisi: Mengganti authAPI.register dengan Supabase
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Password dan konfirmasi password tidak sama');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // 1. Daftar user baru di Supabase Auth
      const { data: userAuth, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            role: 'wali', // Menyimpan role di user metadata
          }
        }
      });
      
      if (authError) throw authError;

      const user = userAuth.user;
      let fotoUrl = null;

      // 2. Unggah foto jika ada
      if (formData.foto) {
        const fileExt = formData.foto.name.split('.').pop();
        const fileName = `${uuidv4()}.${fileExt}`;
        const filePath = `avatars/${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, formData.foto);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        fotoUrl = publicUrl;
      }

      // 3. Simpan data profil (termasuk foto URL) ke tabel 'profiles'
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: user.id, // ID user dari Supabase Auth
          nama: formData.nama,
          email: formData.email,
          no_hp: formData.no_hp,
          alamat: formData.alamat,
          foto_url: fotoUrl,
          role: 'wali'
        });

      if (profileError) throw profileError;

      // 4. Simpan data santri ke tabel 'santri'
      const { error: santriError } = await supabase
        .from('santri')
        .insert({
          nama: formData.nama_anak,
          tgl_lahir: formData.tgl_lahir_anak,
          wali_id: user.id, // Merujuk ke ID wali di tabel profiles
        });

      if (santriError) throw santriError;
      
      alert('Registrasi berhasil! Silakan login dengan akun Anda.');
      navigate('/login');
    } catch (error) {
      setError(error.message || 'Registrasi gagal');
      // Jika terjadi error setelah user dibuat, Supabase tidak menghapus user
      // secara otomatis, perlu penanganan tambahan di backend atau secara manual.
    }
    
    setLoading(false);
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light py-4">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <i className="bi bi-mortarboard display-4 text-primary mb-2"></i>
                  <h1 className="h3 fw-bold">DABRO</h1>
                  <p className="text-muted">Daftar Akun Wali Santri</p>
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle"></i> {error}
                  </div>
                )}

                <form onSubmit={handleSubmit}>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="nama" className="form-label">
                        <i className="bi bi-person"></i> Nama Lengkap
                      </label>
                      <input
                        type="text"
                        id="nama"
                        name="nama"
                        className="form-control"
                        value={formData.nama}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="email" className="form-label">
                        <i className="bi bi-envelope"></i> Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="form-control"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="no_hp" className="form-label">
                      <i className="bi bi-phone"></i> No. HP
                    </label>
                    <input
                      type="tel"
                      id="no_hp"
                      name="no_hp"
                      className="form-control"
                      value={formData.no_hp}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="alamat" className="form-label">
                      <i className="bi bi-geo-alt"></i> Alamat
                    </label>
                    <textarea
                      id="alamat"
                      name="alamat"
                      className="form-control"
                      rows="2"
                      value={formData.alamat}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    ></textarea>
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="nama_anak" className="form-label">
                        <i className="bi bi-person"></i> Nama Anak (Santri)
                      </label>
                      <input
                        type="text"
                        id="nama_anak"
                        name="nama_anak"
                        className="form-control"
                        value={formData.nama_anak}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="tgl_lahir_anak" className="form-label">
                        <i className="bi bi-calendar"></i> Tanggal Lahir Anak
                      </label>
                      <input
                        type="date"
                        id="tgl_lahir_anak"
                        name="tgl_lahir_anak"
                        className="form-control"
                        value={formData.tgl_lahir_anak}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="mb-3">
                    <label htmlFor="foto" className="form-label">
                      <i className="bi bi-camera"></i> Foto Profil (Opsional)
                    </label>
                    <input
                      type="file"
                      id="foto"
                      name="foto"
                      className="form-control"
                      accept="image/*"
                      onChange={handleChange}
                      disabled={loading}
                    />
                    {preview && (
                      <div className="mt-2 text-center">
                        <img 
                          src={preview} 
                          alt="Preview" 
                          className="img-thumbnail"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                        />
                      </div>
                    )}
                  </div>

                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="password" className="form-label">
                        <i className="bi bi-lock"></i> Password
                      </label>
                      <div className="position-relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          className="form-control"
                          value={formData.password}
                          onChange={handleChange}
                          required
                          disabled={loading}
                          minLength="6"
                        />
                        <i
                          className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} position-absolute`}
                          style={{
                            right: '10px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'pointer',
                            zIndex: 10
                          }}
                          onClick={togglePassword}
                        ></i>
                      </div>
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="confirmPassword" className="form-label">
                        <i className="bi bi-lock-fill"></i> Konfirmasi Password
                      </label>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        name="confirmPassword"
                        className="form-control"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        minLength="6"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary w-100 mb-3" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Mendaftar...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-person-plus"></i> Daftar
                      </>
                    )}
                  </button>
                </form>

                <div className="text-center">
                  <p className="text-muted mb-2">
                    Sudah punya akun? 
                    <Link to="/login" className="text-dark text-decoration-none ms-1">Login di sini</Link>
                  </p>
                  <Link to="/" className="text-muted text-decoration-none">
                    <i className="bi bi-arrow-left"></i> Kembali ke Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;