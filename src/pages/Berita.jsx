import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient'; // <<-- Revisi: Impor Supabase Client

const Berita = () => {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [beritaList, setBeritaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBerita, setEditingBerita] = useState(null);
  const [formData, setFormData] = useState({
    judul: '',
    konten: '',
    gambar: null, // <<-- Revisi: Ganti jadi null untuk file
    status: 'draft',
    gambarUrl: '' // <<-- Tambah state baru untuk URL gambar
  });
  const fileInputRef = useRef(null);
  const itemsPerPage = 3;

  useEffect(() => {
    loadBerita();
  }, []);

  const loadBerita = async () => {
    try {
      // <<-- Revisi: Ganti beritaAPI.getAll() dengan Supabase
      const { data, error } = await supabase
        .from('berita')
        .select(`
          id, judul, konten, status, created_at, gambar_url,
          admin_profile:admin_id(nama) // <<-- Asumsi ada relasi ke tabel profiles
        `)
        .eq('status', 'publish')
        .order('created_at', { ascending: false });
        
      if (error) {
        throw error;
      }
      setBeritaList(data);
    } catch (error) {
      console.error('Error loading berita:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingBerita(null);
    setFormData({ judul: '', konten: '', gambar: null, status: 'draft', gambarUrl: '' });
    setShowModal(true);
  };

  const handleEdit = (berita) => {
    setEditingBerita(berita);
    setFormData({
      judul: berita.judul,
      konten: berita.konten,
      gambar: null, // Reset file input
      status: berita.status,
      gambarUrl: berita.gambar_url
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let publicUrl = formData.gambarUrl;

      // <<-- Revisi: Tambahkan logika upload gambar ke Supabase Storage
      if (formData.gambar) {
        const file = formData.gambar;
        const filePath = `${user.id}/${Date.now()}-${file.name}`;
        const { error: uploadError } = await supabase.storage
          .from('berita_images') // <<-- Ganti dengan nama bucket-mu
          .upload(filePath, file);

        if (uploadError) {
          throw uploadError;
        }

        const { data } = supabase.storage
          .from('berita_images')
          .getPublicUrl(filePath);
        
        publicUrl = data.publicUrl;
      }
      // <<-- End of upload logic

      let response;
      if (editingBerita) {
        // <<-- Revisi: Pakai metode update Supabase
        response = await supabase
          .from('berita')
          .update({
            judul: formData.judul,
            konten: formData.konten,
            status: formData.status,
            gambar_url: publicUrl // <<-- Simpan URL gambar
          })
          .eq('id', editingBerita.id);
      } else {
        // <<-- Revisi: Pakai metode insert Supabase
        response = await supabase
          .from('berita')
          .insert({
            judul: formData.judul,
            konten: formData.konten,
            status: formData.status,
            gambar_url: publicUrl, // <<-- Simpan URL gambar
            admin_id: user.id // <<-- Asumsi admin_id dari user yang login
          });
      }

      if (response.error) {
        throw response.error;
      }
      
      setShowModal(false);
      await loadBerita();
      alert(editingBerita ? 'Berita berhasil diupdate!' : 'Berita berhasil dibuat!');
    } catch (error) {
      console.error('Terjadi kesalahan:', error);
      alert('Terjadi kesalahan saat menyimpan berita.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus berita ini?')) {
      try {
        // <<-- Revisi: Ganti beritaAPI.delete() dengan Supabase
        const { error } = await supabase
          .from('berita')
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }
        await loadBerita();
        alert('Berita berhasil dihapus!');
      } catch (error) {
        console.error('Gagal menghapus berita:', error);
        alert('Gagal menghapus berita');
      }
    }
  };

  // <<-- Revisi: Hapus sampleBerita karena data akan dari Supabase
  const filteredBerita = beritaList.filter(berita =>
    berita.judul.toLowerCase().includes(searchTerm.toLowerCase()) ||
    berita.konten.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredBerita.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBerita = filteredBerita.slice(startIndex, endIndex);

  return (
    <div className="container py-4">
      {/* ... Bagian Header tidak berubah ... */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Berita & Artikel</h2>
        <div className="d-flex gap-2">
          <div className="input-group" style={{ width: '300px' }}>
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Cari berita..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {isAdmin() && (
            <button className="btn btn-primary" onClick={handleCreate}>
              <i className="bi bi-plus"></i> Tambah
            </button>
          )}
        </div>
      </div>

      {/* Berita List */}
      <div className="row g-4">
        {loading ? (
          <div className="text-center">Loading...</div>
        ) : (
          currentBerita.length > 0 ? (
            currentBerita.map((berita) => (
              <div key={berita.id} className="col-12">
                <div className="card">
                  <div className="row g-0">
                    <div className="col-md-3">
                      <img
                        src={berita.gambar_url} // <<-- Revisi: Ganti dengan gambar_url
                        className="img-fluid rounded-start h-100"
                        alt={berita.judul}
                        style={{ objectFit: 'cover', minHeight: '150px' }}
                      />
                    </div>
                    <div className="col-md-9">
                      <div className="card-body">
                        <h5 className="card-title fw-bold">{berita.judul}</h5>
                        <div className="d-flex align-items-center text-muted small mb-2">
                          <span className="me-3">
                            <i className="bi bi-calendar"></i> {new Date(berita.created_at).toLocaleDateString()}
                          </span>
                          <span className="me-3">
                            <i className="bi bi-person"></i> {berita.admin_profile.nama}
                          </span>
                        </div>
                        <p className="card-text text-muted">{berita.konten.substring(0, 150)}...</p>
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-primary btn-sm"
                            onClick={() => window.location.href = `/berita/${berita.id}`}
                          >
                            Baca Selengkapnya
                          </button>
                          {isAdmin() && (
                            <>
                              <button 
                                className="btn btn-outline-secondary btn-sm"
                                onClick={() => handleEdit(berita)}
                              >
                                <i className="bi bi-pencil"></i> Edit
                              </button>
                              <button 
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => handleDelete(berita.id)}
                              >
                                <i className="bi bi-trash"></i> Delete
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center mt-5 w-100">
              <i className="bi bi-journal-text display-4 text-muted"></i>
              <p className="mt-2 text-muted">Belum ada berita yang diterbitkan.</p>
            </div>
          )
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <li key={page} className={`page-item ${currentPage === page ? 'active' : ''}`}>
                <button className="page-link" onClick={() => setCurrentPage(page)}>
                  {page}
                </button>
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingBerita ? 'Edit Berita' : 'Tambah Berita'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Judul</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.judul}
                      onChange={(e) => setFormData({...formData, judul: e.target.value})}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Konten</label>
                    <textarea
                      className="form-control"
                      rows="5"
                      value={formData.konten}
                      onChange={(e) => setFormData({...formData, konten: e.target.value})}
                      required
                    ></textarea>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Gambar</label>
                    <input
                      type="file" // <<-- Revisi: Ganti jadi type file
                      className="form-control"
                      ref={fileInputRef}
                      onChange={(e) => setFormData({...formData, gambar: e.target.files[0]})}
                    />
                    <small className="text-muted">Pilih file gambar dari komputer</small>
                    {formData.gambarUrl && (
                      <div className="mt-2">
                        <p className="mb-1">Gambar saat ini:</p>
                        <img src={formData.gambarUrl} alt="Gambar Berita" className="img-thumbnail" style={{ maxWidth: '200px' }} />
                      </div>
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Status</label>
                    <select
                      className="form-control"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="draft">Draft</option>
                      <option value="publish">Publish</option>
                    </select>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setShowModal(false)}
                  >
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Berita;