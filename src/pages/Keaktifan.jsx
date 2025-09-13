import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient'; // <<-- Revisi: Impor Supabase Client

const Keaktifan = () => {
  const { user, isAdmin, isWali } = useAuth();
  const [selectedKategori, setSelectedKategori] = useState('all');
  const [selectedSantri, setSelectedSantri] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [keaktifanData, setKeaktifanData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingKeaktifan, setEditingKeaktifan] = useState(null);
  const [formData, setFormData] = useState({
    santri_id: '',
    kategori_id: '',
    nama_kegiatan: '',
    tanggal_kegiatan: '',
    keterangan: '',
    status: 'hadir'
  });
  const [santriList, setSantriList] = useState([]);

  useEffect(() => {
    loadKeaktifan();
    loadSantri();
  }, [user]); // <<-- Revisi: Menambah user sebagai dependensi

  // <<-- Revisi: Menggunakan Supabase untuk memuat data santri
  const loadSantri = async () => {
    try {
      const { data, error } = await supabase
        .from('santri')
        .select(`id, nama, kelas, wali_id`)
        .order('nama', { ascending: true });

      if (error) {
        throw error;
      }
      
      if (isWali()) {
        const santriWali = data.filter(s => s.wali_id === user.id);
        setSantriList(santriWali);
        setSelectedSantri(santriWali.length > 0 ? santriWali[0].id : 'all');
      } else {
        setSantriList(data);
      }

    } catch (error) {
      console.error('Error loading santri:', error);
    }
  };

  // <<-- Revisi: Menggunakan Supabase untuk memuat data keaktifan
  const loadKeaktifan = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('keaktifan')
        .select(`
          id, nama_kegiatan, tanggal_kegiatan, keterangan, status,
          santri:santri_id(id, nama, kelas, wali_id), // Mengambil data santri
          kategori:kategori_id(id, nama) // Mengambil data kategori
        `)
        .order('tanggal_kegiatan', { ascending: false });
        
      if (error) {
        throw error;
      }
      setKeaktifanData(data);
    } catch (error) {
      console.error('Error loading keaktifan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingKeaktifan(null);
    setFormData({
      santri_id: '',
      kategori_id: '',
      nama_kegiatan: '',
      tanggal_kegiatan: '',
      keterangan: '',
      status: 'hadir'
    });
    setShowModal(true);
  };

  const handleEdit = (keaktifan) => {
    setEditingKeaktifan(keaktifan);
    
    // Konversi format tanggal untuk input
    const tanggalValue = keaktifan.tanggal_kegiatan ? new Date(keaktifan.tanggal_kegiatan).toISOString().slice(0, 16) : '';
    
    setFormData({
      santri_id: keaktifan.santri.id,
      kategori_id: keaktifan.kategori.id,
      nama_kegiatan: keaktifan.nama_kegiatan,
      tanggal_kegiatan: tanggalValue,
      keterangan: keaktifan.keterangan,
      status: keaktifan.status
    });
    setShowModal(true);
  };

  // <<-- Revisi: Menggunakan Supabase untuk submit data
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      if (editingKeaktifan) {
        response = await supabase
          .from('keaktifan')
          .update(formData)
          .eq('id', editingKeaktifan.id);
      } else {
        response = await supabase
          .from('keaktifan')
          .insert(formData);
      }

      if (response.error) {
        throw response.error;
      }

      setShowModal(false);
      await loadKeaktifan();
      alert(editingKeaktifan ? 'Keaktifan berhasil diupdate!' : 'Keaktifan berhasil ditambahkan!');
    } catch (error) {
      alert(`Terjadi kesalahan: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // <<-- Revisi: Menggunakan Supabase untuk hapus data
  const handleDelete = async (id) => {
    if (window.confirm('Yakin ingin menghapus data keaktifan ini?')) {
      try {
        const { error } = await supabase
          .from('keaktifan')
          .delete()
          .eq('id', id);

        if (error) {
          throw error;
        }

        await loadKeaktifan();
        alert('Data keaktifan berhasil dihapus!');
      } catch (error) {
        alert(`Gagal menghapus data keaktifan: ${error.message}`);
      }
    }
  };
  
  // <<-- Revisi: Hapus data sampel
  
  // Filter data berdasarkan role user
  const filteredByRole = isWali() 
    ? keaktifanData.filter(data => data.santri.wali_id === user?.id)
    : keaktifanData;

  const getStatusBadge = (status) => {
    const statusConfig = {
      hadir: { class: 'bg-success', text: 'Hadir', icon: 'bi-check-circle' },
      tidak_hadir: { class: 'bg-danger', text: 'Tidak Hadir', icon: 'bi-x-circle' },
      izin: { class: 'bg-warning', text: 'Izin', icon: 'bi-exclamation-circle' },
      sakit: { class: 'bg-info', text: 'Sakit', icon: 'bi-heart-pulse' }
    };
    
    const config = statusConfig[status];
    return (
      <span className={`badge ${config.class}`}>
        <i className={`bi ${config.icon} me-1`}></i>
        {config.text}
      </span>
    );
  };

  const getKategoriIcon = (kategori) => {
    const icons = {
      'Sekolah': 'bi-book',
      'Pondok': 'bi-house',
      'Madrasah': 'bi-mortarboard'
    };
    return icons[kategori] || 'bi-calendar';
  };

  const filteredData = filteredByRole.filter(item => {
    const kategoriMatch = selectedKategori === 'all' || (item.kategori.nama) === selectedKategori;
    const santriMatch = selectedSantri === 'all' || item.santri.id === selectedSantri;
    const searchMatch = (item.nama_kegiatan || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                       (item.santri.nama || '').toLowerCase().includes(searchTerm.toLowerCase());
    return kategoriMatch && santriMatch && searchMatch;
  });

  return (
    <div className="container py-4">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Keaktifan Santri</h2>
        <div className="d-flex gap-2">
          <div className="input-group" style={{ width: '200px' }}>
            <span className="input-group-text">
              <i className="bi bi-search"></i>
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Cari kegiatan..."
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
            value={selectedSantri}
            onChange={(e) => setSelectedSantri(e.target.value)}
          >
            <option value="all">Semua Santri</option>
            {santriList.map(santri => (
              <option key={santri.id} value={santri.id}>
                {santri.nama} - {santri.kelas}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-4">
          <select 
            className="form-select"
            value={selectedKategori}
            onChange={(e) => setSelectedKategori(e.target.value)}
          >
            <option value="all">Semua Kategori</option>
            <option value="Sekolah">Sekolah</option>
            <option value="Pondok">Pondok</option>
            <option value="Madrasah">Madrasah</option>
          </select>
        </div>
        <div className="col-md-4">
          <input type="date" className="form-control" />
        </div>
      </div>

      {/* Keaktifan Table */}
      <div className="card">
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Santri</th>
                  <th>Kategori</th>
                  <th>Kegiatan</th>
                  <th>Tanggal & Waktu</th>
                  <th>Status</th>
                  <th>Keterangan</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="7" className="text-center">Loading...</td>
                  </tr>
                ) : (
                  filteredData.length > 0 ? (
                    filteredData.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div>
                            <strong>{item.santri.nama}</strong>
                            <br />
                            <small className="text-muted">Kelas {item.santri.kelas}</small>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark">
                            <i className={`bi ${getKategoriIcon(item.kategori.nama)} me-1`}></i>
                            {item.kategori.nama}
                          </span>
                        </td>
                        <td>{item.nama_kegiatan}</td>
                        <td>
                          <div>
                            <i className="bi bi-calendar me-1"></i>
                            {new Date(item.tanggal_kegiatan).toLocaleDateString('id-ID')}
                            <br />
                            <i className="bi bi-clock me-1"></i>
                            {new Date(item.tanggal_kegiatan).toLocaleTimeString('id-ID', { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </div>
                        </td>
                        <td>{getStatusBadge(item.status)}</td>
                        <td>
                          <small className="text-muted">{item.keterangan}</small>
                        </td>
                        <td>
                          {isAdmin() && (
                            <div className="btn-group btn-group-sm">
                              <button 
                                className="btn btn-outline-primary"
                                onClick={() => handleEdit(item)}
                              >
                                <i className="bi bi-pencil"></i>
                              </button>
                              <button 
                                className="btn btn-outline-danger"
                                onClick={() => handleDelete(item.id)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center text-muted">Tidak ada data keaktifan yang ditemukan.</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="row mt-4">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <i className="bi bi-check-circle display-4 text-success"></i>
              <h3 className="text-success mt-2">
                {filteredByRole.filter(item => item.status === 'hadir').length}
              </h3>
              <p className="text-muted">Hadir</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <i className="bi bi-x-circle display-4 text-danger"></i>
              <h3 className="text-danger mt-2">
                {filteredByRole.filter(item => item.status === 'tidak_hadir').length}
              </h3>
              <p className="text-muted">Tidak Hadir</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <i className="bi bi-exclamation-circle display-4 text-warning"></i>
              <h3 className="text-warning mt-2">
                {filteredByRole.filter(item => item.status === 'izin').length}
              </h3>
              <p className="text-muted">Izin</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <i className="bi bi-heart-pulse display-4 text-info"></i>
              <h3 className="text-info mt-2">
                {filteredByRole.filter(item => item.status === 'sakit').length}
              </h3>
              <p className="text-muted">Sakit</p>
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
                  {editingKeaktifan ? 'Edit Keaktifan' : 'Tambah Keaktifan'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Santri</label>
                      <select
                        className="form-control"
                        value={formData.santri_id}
                        onChange={(e) => setFormData({...formData, santri_id: e.target.value})}
                        required
                      >
                        <option value="">Pilih Santri</option>
                        {santriList.map(santri => (
                          <option key={santri.id} value={santri.id}>
                            {santri.nama} - {santri.kelas}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Kategori</label>
                      <select
                        className="form-control"
                        value={formData.kategori_id}
                        onChange={(e) => setFormData({...formData, kategori_id: e.target.value})}
                        required
                      >
                        <option value="">Pilih Kategori</option>
                        <option value="1">Sekolah</option>
                        <option value="2">Pondok</option>
                        <option value="3">Madrasah</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Nama Kegiatan</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.nama_kegiatan}
                      onChange={(e) => setFormData({...formData, nama_kegiatan: e.target.value})}
                      required
                    />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Tanggal Kegiatan</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={formData.tanggal_kegiatan}
                        onChange={(e) => setFormData({...formData, tanggal_kegiatan: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Status</label>
                      <select
                        className="form-control"
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value})}
                      >
                        <option value="hadir">Hadir</option>
                        <option value="tidak_hadir">Tidak Hadir</option>
                        <option value="izin">Izin</option>
                        <option value="sakit">Sakit</option>
                      </select>
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Keterangan</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      value={formData.keterangan}
                      onChange={(e) => setFormData({...formData, keterangan: e.target.value})}
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
    </div>
  );
};

export default Keaktifan;