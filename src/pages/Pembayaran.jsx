import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient'; // <<-- Revisi: Impor Supabase
import PaymentDetail from './PaymentDetail';

const Pembayaran = () => {
  const { user, isAdmin, isWali } = useAuth();
  const [selectedSantri, setSelectedSantri] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [pembayaranData, setPembayaranData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [santriList, setSantriList] = useState([]);
  const [jenisPayment, setJenisPayment] = useState([]);
  const [newPayment, setNewPayment] = useState({
    santri_id: '',
    jenis_id: '',
    periode: '',
    jumlah: ''
  });

  useEffect(() => {
    loadPembayaran();
    loadSantri();
    loadJenisPayment();
  }, [user]); // Tambahkan user sebagai dependensi

  // <<-- Revisi: Menggunakan Supabase untuk memuat data pembayaran
  const loadPembayaran = async () => {
    try {
      setLoading(true);
      const { data: pembayaran, error: pembayaranError } = await supabase
        .from('pembayaran')
        .select(`
          *,
          santri:santri_id(id, nama, kelas, wali_id),
          jenis:jenis_id(id, nama_pembayaran)
        `)
        .order('created_at', { ascending: false });

      if (pembayaranError) throw pembayaranError;

      // Kelompokkan data berdasarkan santri
      const groupedData = pembayaran.reduce((acc, curr) => {
        const santriId = curr.santri.id;
        if (!acc[santriId]) {
          acc[santriId] = {
            santri: curr.santri,
            pembayaran: []
          };
        }
        acc[santriId].pembayaran.push({
          ...curr,
          jenis: curr.jenis.nama_pembayaran
        });
        return acc;
      }, {});
      
      setPembayaranData(Object.values(groupedData));
    } catch (error) {
      console.error('Error loading pembayaran:', error);
    } finally {
      setLoading(false);
    }
  };

  // <<-- Revisi: Menggunakan Supabase untuk memuat data santri
  const loadSantri = async () => {
    try {
      const { data, error } = await supabase
        .from('santri')
        .select('id, nama, kelas, wali_id');
      if (error) throw error;
      setSantriList(data);
    } catch (error) {
      console.error('Error loading santri:', error);
    }
  };

  // <<-- Revisi: Menggunakan Supabase untuk memuat jenis pembayaran
  const loadJenisPayment = async () => {
    try {
      const { data, error } = await supabase
        .from('jenis_pembayaran')
        .select('id, nama_pembayaran, jumlah_default');
      if (error) throw error;
      setJenisPayment(data);
    } catch (error) {
      console.error('Error loading jenis pembayaran:', error);
    }
  };

  // <<-- Revisi: Menggunakan Supabase untuk menambah pembayaran baru
  const handleAddPayment = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('pembayaran')
        .insert({
          santri_id: newPayment.santri_id,
          jenis_id: newPayment.jenis_id,
          periode: newPayment.periode,
          jumlah: newPayment.jumlah,
          status: 'belum',
        });
      
      if (error) throw error;
      await loadPembayaran();
      setShowAddModal(false);
      setNewPayment({ santri_id: '', jenis_id: '', periode: '', jumlah: '' });
      alert('Pembayaran berhasil ditambahkan!');
    } catch (error) {
      console.error('Error adding payment:', error);
      alert('Gagal menambahkan pembayaran: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // <<-- Revisi: Menggunakan Supabase untuk update status pembayaran
  const handleStatusUpdate = async (paymentId, newStatus) => {
    if (!paymentId) {
      alert('ID pembayaran tidak valid');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('pembayaran')
        .update({ status: newStatus })
        .eq('id', paymentId);

      if (error) throw error;
      
      await loadPembayaran();
      alert('Status pembayaran berhasil diupdate!');
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert('Gagal update status pembayaran: ' + error.message);
    }
  };

  // <<-- Revisi: Hapus data sampel
  const filteredByRole = isWali() 
    ? pembayaranData.filter(data => data.santri.wali_id === user?.id)
    : pembayaranData;

  const filteredData = filteredByRole.filter(data => {
    const santriMatch = data.santri.nama.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = selectedStatus === 'all' || data.pembayaran.some(p => p.status === selectedStatus);
    const santriSelectMatch = selectedSantri === 'all' || data.santri.id.toString() === selectedSantri;
    return santriMatch && statusMatch && santriSelectMatch;
  });

  const getStatusBadge = (status) => {
    const statusConfig = {
      belum: { class: 'status-belum', text: 'BELUM LUNAS', icon: 'bi-x-circle' },
      pending: { class: 'status-pending', text: 'PENDING', icon: 'bi-clock' },
      lunas: { class: 'status-lunas', text: 'LUNAS', icon: 'bi-check-circle' }
    };
    
    const config = statusConfig[status];
    return (
      <span className={`badge ${config.class} d-block mb-2`}>
        <i className={`bi ${config.icon} me-1`}></i>
        {config.text}
      </span>
    );
  };

  const formatRupiah = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Pembayaran Santri</h2>
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
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddModal(true)}
            >
              <i className="bi bi-plus"></i> Tambah
            </button>
          )}
        </div>
      </div>

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
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="all">Semua Status</option>
            <option value="belum">Belum Lunas</option>
            <option value="pending">Pending</option>
            <option value="lunas">Lunas</option>
          </select>
        </div>
        <div className="col-md-4">
          <select className="form-select">
            <option>Periode</option>
            <option>Januari 2024</option>
            <option>Desember 2023</option>
            <option>November 2023</option>
          </select>
        </div>
      </div>

      <div className="row g-4">
        {loading ? (
          <div className="text-center w-100 py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          filteredData.length > 0 ? (
            filteredData.map((data) => (
              <div key={data.santri.id} className="col-12">
                <div className="card payment-card">
                  <div className="card-header bg-light">
                    <h5 className="mb-0">
                      <i className="bi bi-person-circle me-2"></i>
                      SANTRI: {data.santri.nama} - {data.santri.kelas}
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      {data.pembayaran.map((pembayaran) => (
                        <div key={pembayaran.id} className="col-lg-3 col-md-6">
                          <div className="card h-100 text-center">
                            <div className="card-body">
                              <div className="mb-2">
                                <i className="bi bi-credit-card display-6 text-primary"></i>
                              </div>
                              <h6 className="card-title fw-bold">
                                {pembayaran.jenis}
                              </h6>
                              <p className="card-text small text-muted mb-1">
                                {pembayaran.periode}
                              </p>
                              <p className="card-text fw-bold">
                                {formatRupiah(pembayaran.jumlah)}
                              </p>
                              {getStatusBadge(pembayaran.status)}
                              
                              {isAdmin() && pembayaran.bukti_url && (
                                <div className="mb-2">
                                  <button 
                                    className="btn btn-info btn-sm mb-1"
                                    onClick={() => {
                                      setSelectedImage(pembayaran.bukti_url);
                                      setShowImageModal(true);
                                    }}
                                  >
                                    <i className="bi bi-image"></i> Lihat Bukti
                                  </button>
                                </div>
                              )}
                              
                              {isAdmin() ? (
                                <div className="d-grid gap-1">
                                  {pembayaran.status === 'pending' && (
                                    <>
                                      <button 
                                        className="btn btn-success btn-sm"
                                        onClick={() => handleStatusUpdate(pembayaran.id, 'lunas')}
                                      >
                                        <i className="bi bi-check"></i> Setujui
                                      </button>
                                      <button 
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleStatusUpdate(pembayaran.id, 'belum')}
                                      >
                                        <i className="bi bi-x"></i> Tolak
                                      </button>
                                    </>
                                  )}
                                  <select 
                                    className="form-select form-select-sm"
                                    value={pembayaran.status}
                                    onChange={(e) => handleStatusUpdate(pembayaran.id, e.target.value)}
                                  >
                                    <option value="belum">Belum</option>
                                    <option value="pending">Pending</option>
                                    <option value="lunas">Lunas</option>
                                  </select>
                                </div>
                              ) : (
                                pembayaran.status === 'belum' ? (
                                  <button 
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setSelectedPayment(pembayaran)}
                                  >
                                    BAYAR
                                  </button>
                                ) : pembayaran.status === 'pending' ? (
                                  <span className="badge bg-warning">Verifikasi</span>
                                ) : (
                                  <span className="badge bg-success">Lunas</span>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-12 text-center py-5">
              <i className="bi bi-cash-stack display-4 text-muted"></i>
              <p className="mt-2 text-muted">Belum ada data pembayaran.</p>
            </div>
          )
        )}
      </div>

      <div className="row mt-5">
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-danger">
                {filteredByRole.reduce((count, data) => 
                  count + data.pembayaran.filter(p => p.status === 'belum').length, 0
                )}
              </h3>
              <p className="text-muted">Belum Lunas</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-warning">
                {filteredByRole.reduce((count, data) => 
                  count + data.pembayaran.filter(p => p.status === 'pending').length, 0
                )}
              </h3>
              <p className="text-muted">Pending</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-success">
                {filteredByRole.reduce((count, data) => 
                  count + data.pembayaran.filter(p => p.status === 'lunas').length, 0
                )}
              </h3>
              <p className="text-muted">Lunas</p>
            </div>
          </div>
        </div>
        <div className="col-md-3">
          <div className="card text-center">
            <div className="card-body">
              <h3 className="text-primary">
                {filteredByRole.reduce((count, data) => 
                  count + data.pembayaran.length, 0
                )}
              </h3>
              <p className="text-muted">Total</p>
            </div>
          </div>
        </div>
      </div>

      {selectedPayment && (
        <PaymentDetail
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onPaymentProof={loadPembayaran}
        />
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-image me-2"></i>
                  Bukti Pembayaran
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowImageModal(false)}
                ></button>
              </div>
              <div className="modal-body text-center">
                <img 
                  src={selectedImage} 
                  alt="Bukti Pembayaran" 
                  className="img-fluid rounded"
                  style={{ maxHeight: '70vh', objectFit: 'contain' }}
                  onError={(e) => {
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5HYW1iYXIgdGlkYWsgZGl0ZW11a2FuPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowImageModal(false)}
                >
                  Tutup
                </button>
                <a 
                  href={selectedImage} 
                  download 
                  className="btn btn-primary"
                >
                  <i className="bi bi-download me-1"></i>
                  Download
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Modal */}
      {showAddModal && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-plus-circle me-2"></i>
                  Tambah Pembayaran
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowAddModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <form>
                  <div className="mb-3">
                    <label className="form-label">Santri</label>
                    <select 
                      className="form-select"
                      value={newPayment.santri_id}
                      onChange={(e) => setNewPayment({...newPayment, santri_id: e.target.value})}
                    >
                      <option value="">Pilih Santri</option>
                      {santriList.map(santri => (
                        <option key={santri.id} value={santri.id}>
                          {santri.nama} - {santri.kelas}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Jenis Pembayaran</label>
                    <select 
                      className="form-select"
                      value={newPayment.jenis_id}
                      onChange={(e) => {
                        const selectedJenis = jenisPayment.find(j => j.id == e.target.value);
                        setNewPayment({
                          ...newPayment, 
                          jenis_id: e.target.value,
                          jumlah: selectedJenis ? selectedJenis.jumlah_default : ''
                        });
                      }}
                    >
                      <option value="">Pilih Jenis</option>
                      {jenisPayment.map(jenis => (
                        <option key={jenis.id} value={jenis.id}>
                          {jenis.nama_pembayaran}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Periode</label>
                    <input 
                      type="text" 
                      className="form-control"
                      placeholder="Contoh: Januari 2024"
                      value={newPayment.periode}
                      onChange={(e) => setNewPayment({...newPayment, periode: e.target.value})}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Jumlah</label>
                    <input 
                      type="number" 
                      className="form-control"
                      value={newPayment.jumlah}
                      onChange={(e) => setNewPayment({...newPayment, jumlah: e.target.value})}
                    />
                  </div>
                </form>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowAddModal(false)}
                >
                  Batal
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={handleAddPayment}
                  disabled={!newPayment.santri_id || !newPayment.jenis_id || !newPayment.periode || !newPayment.jumlah}
                >
                  <i className="bi bi-save me-1"></i>
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Pembayaran;