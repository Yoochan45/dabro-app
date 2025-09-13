import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';

const Santri = () => {
  const { isAdmin } = useAuth();
  const [selectedKelas, setSelectedKelas] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all'); // Menggunakan gender untuk filter
  const [searchTerm, setSearchTerm] = useState('');
  const [santriData, setSantriData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingSantri, setEditingSantri] = useState(null);
  const [selectedSantri, setSelectedSantriDetail] = useState(null);
  const [formData, setFormData] = useState({
    nama: '', // Menggunakan 'nama' untuk konsistensi
    tgl_lahir: '',
    alamat: '',
    kelas: '',
    kamar: '',
    jenis_kelamin: ''
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    // Memuat data santri saat komponen dimuat
    loadSantri();
  }, []);

  const loadSantri = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('santri')
        .select('*');
      
      if (error) throw error;
      
      setSantriData(data);
    } catch (error) {
      console.error('Error loading santri:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingSantri(null);
    setFormData({
      nama: '',
      tgl_lahir: '',
      alamat: '',
      kelas: '',
      kamar: '',
      jenis_kelamin: ''
    });
    setShowModal(true);
  };

  const handleEdit = (santri) => {
    setEditingSantri(santri);
    setFormData({
      nama: santri.nama,
      tgl_lahir: santri.tgl_lahir,
      alamat: santri.alamat,
      kelas: santri.kelas,
      kamar: santri.kamar,
      jenis_kelamin: santri.jenis_kelamin || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (editingSantri) {
        // Update data santri yang ada
        const { error } = await supabase
          .from('santri')
          .update(formData)
          .eq('id', editingSantri.id);

        if (error) throw error;
        alert('Santri berhasil diupdate!');
      } else {
        // Tambah data santri baru
        const { error } = await supabase
          .from('santri')
          .insert(formData);

        if (error) throw error;
        alert('Santri berhasil ditambahkan!');
      }

      setShowModal(false);
      await loadSantri();
    } catch (error) {
      alert('Gagal menyimpan santri: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (santri) => {
    setSelectedSantriDetail(santri);
    setShowDetailModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus santri ini?')) {
      try {
        const { error } = await supabase
          .from('santri')
          .delete()
          .eq('id', id);

        if (error) throw error;
        await loadSantri();
        alert('Santri berhasil dihapus!');
      } catch (error) {
        alert('Gagal menghapus santri: ' + error.message);
      }
    }
  };

  const getInitials = (nama) => {
    if (!nama) return '';
    return nama.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return 'N/A';
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const filteredSantri = santriData.filter(santri => {
    const kelasMatch = selectedKelas === 'all' || santri.kelas === selectedKelas;
    const genderMatch = selectedGender === 'all' || (santri.jenis_kelamin && santri.jenis_kelamin.toLowerCase() === selectedGender);
    const searchMatch = (santri.nama || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (santri.alamat || '').toLowerCase().includes(searchTerm.toLowerCase());
    return kelasMatch && genderMatch && searchMatch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredSantri.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentSantri = filteredSantri.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Daftar Santri</h2>
        <div className="d-flex gap-2">
          <div className="input-group" style={{ width: '200px' }}>
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Cari santri..."
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

      {/* Filters */}
      <div className="row mb-4">
        <div className="col-md-4">
          <select 
            className="form-select"
            value={selectedKelas}
            onChange={(e) => setSelectedKelas(e.target.value)}
          >
            <option value="all">Semua Kelas</option>
            <option value="1 MTs">1 MTs</option>
            <option value="2 MTs">2 MTs</option>
            <option value="3 MTs">3 MTs</option>
            <option value="1 MA">1 MA</option>
            <option value="2 MA">2 MA</option>
            <option value="3 MA">3 MA</option>
            <option value="Lulus">Lulus</option>
          </select>
        </div>
        <div className="col-md-4">
          <select 
            className="form-select"
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
          >
            <option value="all">Semua Santri</option>
            <option value="putra">Santri Putra</option>
            <option value="putri">Santri Putri</option>
          </select>
        </div>
        <div className="col-md-4">
          <select className="form-select">
            <option>Status Aktif</option>
            <option>Aktif</option>
            <option>Non-Aktif</option>
          </select>
        </div>
      </div>

      {/* Santri Grid */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          {currentSantri.length > 0 ? (
            currentSantri.map((santri) => (
              <div key={santri.id} className="col-lg-3 col-md-4 col-sm-6">
                <div className="card santri-card h-100">
                  <div className="card-body text-center">
                    <div className="santri-avatar">
                      {santri.foto_url ? (
                        <img 
                          src={santri.foto_url} 
                          alt={santri.nama}
                          className="rounded-circle"
                          style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                        />
                      ) : (
                        <i className="bi bi-person"></i>
                      )}
                    </div>
                    <h6 className="card-title fw-bold">{santri.nama}</h6>
                    <p className="text-muted small mb-1">Kelas {santri.kelas}</p>
                    <p className="text-muted small mb-2">Kamar {santri.kamar}</p>
                    <div className="mb-2">
                      <span className="badge bg-success">
                        <i className="bi bi-check-circle me-1"></i>
                        {santri.status || 'Aktif'}
                      </span>
                    </div>
                    <div className="small text-muted mb-3">
                      <div><i className="bi bi-calendar me-1"></i>Umur: {calculateAge(santri.tgl_lahir)} tahun</div>
                      <div><i className="bi bi-geo-alt me-1"></i>{santri.alamat}</div>
                    </div>
                    <button 
                      className="btn btn-primary btn-sm w-100"
                      onClick={() => handleViewDetail(santri)}
                    >
                      <i className="bi bi-eye"></i> Detail
                    </button>
                    {isAdmin() && (
                      <div className="mt-2">
                        <button 
                          className="btn btn-outline-secondary btn-sm me-1"
                          onClick={() => handleEdit(santri)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button 
                          className="btn btn-outline-danger btn-sm"
                          onClick={() => handleDelete(santri.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12 text-center py-5">
              <p className="text-muted">Tidak ada data santri yang ditemukan.</p>
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <nav className="mt-4">
          <ul className="pagination justify-content-center">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </button>
            </li>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                <button 
                  className="page-link"
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </button>
              </li>
            ))}
            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
              <button 
                className="page-link"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}

      {/* Statistics */}
      <div className="row mt-5">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <i className="bi bi-people display-4 text-primary"></i>
              <h3 className="text-primary mt-2">{filteredSantri.length}</h3>
              <p className="text-muted">Total Santri</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <i className="bi bi-person-check display-4 text-success"></i>
              <h3 className="text-success mt-2">{filteredSantri.filter(s => (s.status || 'Aktif') === 'Aktif').length}</h3>
              <p className="text-muted">Santri Aktif</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <i className="bi bi-mortarboard display-4 text-info"></i>
              <h3 className="text-info mt-2">6</h3>
              <p className="text-muted">Kelas</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <i className="bi bi-house display-4 text-warning"></i>
              <h3 className="text-warning mt-2">2</h3>
              <p className="text-muted">Blok Kamar</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {editingSantri ? 'Edit Santri' : 'Tambah Santri'}
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
                    <label className="form-label">Nama Santri</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.nama}
                      onChange={(e) => setFormData({...formData, nama: e.target.value})}
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Tanggal Lahir</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.tgl_lahir}
                        onChange={(e) => setFormData({...formData, tgl_lahir: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Kelas</label>
                      <select
                        className="form-control"
                        value={formData.kelas}
                        onChange={(e) => setFormData({...formData, kelas: e.target.value})}
                        required
                      >
                        <option value="">Pilih Kelas</option>
                        <option value="1 MTs">1 MTs</option>
                        <option value="2 MTs">2 MTs</option>
                        <option value="3 MTs">3 MTs</option>
                        <option value="1 MA">1 MA</option>
                        <option value="2 MA">2 MA</option>
                        <option value="3 MA">3 MA</option>
                      </select>
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Jenis Kelamin</label>
                      <select
                        className="form-control"
                        value={formData.jenis_kelamin}
                        onChange={(e) => setFormData({...formData, jenis_kelamin: e.target.value})}
                        required
                      >
                        <option value="">Pilih Jenis Kelamin</option>
                        <option value="putra">Putra</option>
                        <option value="putri">Putri</option>
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Kamar</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Putra-A12, Putri-B08, dll"
                        value={formData.kamar}
                        onChange={(e) => setFormData({...formData, kamar: e.target.value})}
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Alamat</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.alamat}
                      onChange={(e) => setFormData({...formData, alamat: e.target.value})}
                      required
                    ></textarea>
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

      {/* Detail Modal */}
      {showDetailModal && selectedSantri && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-person-circle me-2"></i>
                  Detail Santri
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowDetailModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-4 text-center mb-3">
                    <div className="santri-avatar mb-3">
                      {selectedSantri.foto_url ? (
                        <img 
                          src={selectedSantri.foto_url} 
                          alt={selectedSantri.nama}
                          className="rounded-circle"
                          style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div className="bg-light rounded-circle d-flex align-items-center justify-content-center" style={{ width: '120px', height: '120px' }}>
                          <i className="bi bi-person display-4 text-muted"></i>
                        </div>
                      )}
                    </div>
                    <span className="badge bg-success">
                      <i className="bi bi-check-circle me-1"></i>
                      {selectedSantri.status || 'Aktif'}
                    </span>
                  </div>
                  <div className="col-md-8">
                    <table className="table table-borderless">
                      <tbody>
                        <tr>
                          <td><strong>Nama Lengkap:</strong></td>
                          <td>{selectedSantri.nama}</td>
                        </tr>
                        <tr>
                          <td><strong>Kelas:</strong></td>
                          <td>{selectedSantri.kelas}</td>
                        </tr>
                        <tr>
                          <td><strong>Kamar:</strong></td>
                          <td>{selectedSantri.kamar}</td>
                        </tr>
                        <tr>
                          <td><strong>Tanggal Lahir:</strong></td>
                          <td>{selectedSantri.tgl_lahir}</td>
                        </tr>
                        <tr>
                          <td><strong>Umur:</strong></td>
                          <td>{calculateAge(selectedSantri.tgl_lahir)} tahun</td>
                        </tr>
                        <tr>
                          <td><strong>Alamat:</strong></td>
                          <td>{selectedSantri.alamat}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowDetailModal(false)}
                >
                  Tutup
                </button>
                {isAdmin() && (
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={() => {
                      setShowDetailModal(false);
                      handleEdit(selectedSantri);
                    }}
                  >
                    <i className="bi bi-pencil me-1"></i>
                    Edit Data
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Santri;
