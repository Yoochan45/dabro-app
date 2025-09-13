import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient'; // <<-- Revisi: Impor Supabase Client
import { v4 as uuidv4 } from 'uuid'; // <<-- Tambahan: Untuk membuat nama file unik

const PaymentDetail = ({ payment, onClose, onPaymentProof }) => {
  const [selectedMethod, setSelectedMethod] = useState('');
  const [proofFile, setProofFile] = useState(null);
  const [showProofUpload, setShowProofUpload] = useState(false);
  const [loading, setLoading] = useState(false); // <<-- Tambahan: State untuk loading

  const paymentMethods = [
    { id: 'bca', name: 'BCA', account: '1234567890', holder: 'Pesantren Darul Abror' },
    { id: 'mandiri', name: 'Mandiri', account: '0987654321', holder: 'Pesantren Darul Abror' },
    { id: 'bri', name: 'BRI', account: '5555666677', holder: 'Pesantren Darul Abror' },
    { id: 'shopeepay', name: 'ShopeePay', account: '081234567890', holder: 'Admin Pesantren' },
    { id: 'dana', name: 'DANA', account: '081234567890', holder: 'Admin Pesantren' },
    { id: 'gopay', name: 'GoPay', account: '081234567890', holder: 'Admin Pesantren' }
  ];

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
  };

  // <<-- Revisi: Mengganti fetch dengan Supabase Storage & Database
  const handleProofUpload = async () => {
    if (!proofFile) {
      alert('Pilih file bukti pembayaran terlebih dahulu');
      return;
    }

    setLoading(true);

    try {
      // 1. Unggah file ke Supabase Storage
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `payment_proofs/${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('bukti_pembayaran') // Nama bucket di Supabase Storage
        .upload(filePath, proofFile);
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Dapatkan URL publik dari file yang diunggah
      const { data: { publicUrl } } = supabase.storage
        .from('bukti_pembayaran')
        .getPublicUrl(filePath);

      // 2. Perbarui data pembayaran di Supabase Database
      const { error: updateError } = await supabase
        .from('pembayaran')
        .update({ 
          status: 'pending', 
          metode_pembayaran: selectedMethod.name, // atau id
          bukti_url: publicUrl,
          tanggal_bayar: new Date().toISOString()
        })
        .eq('id', payment.id); // Menggunakan id pembayaran

      if (updateError) {
        throw updateError;
      }
      
      alert('Bukti pembayaran berhasil diupload! Menunggu verifikasi admin.');
      onPaymentProof();
      onClose();

    } catch (error) {
      console.error('Error uploading proof:', error);
      alert('Gagal upload bukti pembayaran: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">Detail Pembayaran</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          
          <div className="modal-body">
            <div className="card mb-3">
              <div className="card-body">
                <h6 className="card-title">{payment.jenis}</h6>
                <p className="card-text">
                  <strong>Periode:</strong> {payment.periode}<br/>
                  <strong>Jumlah:</strong> Rp {payment.jumlah?.toLocaleString('id-ID')}<br/>
                  <strong>Status:</strong> 
                  <span className={`badge ms-2 ${
                    payment.status === 'lunas' ? 'bg-success' : 
                    payment.status === 'pending' ? 'bg-warning' : 'bg-danger'
                  }`}>
                    {payment.status.toUpperCase()}
                  </span>
                </p>
              </div>
            </div>

            {payment.status === 'belum' && !showProofUpload && (
              <div>
                <h6>Pilih Metode Pembayaran:</h6>
                <div className="row g-3">
                  {paymentMethods.map((method) => (
                    <div key={method.id} className="col-md-6">
                      <div 
                        className={`card payment-method ${selectedMethod?.id === method.id ? 'border-primary' : ''}`}
                        style={{ cursor: 'pointer' }}
                        onClick={() => handleMethodSelect(method)}
                      >
                        <div className="card-body text-center">
                          <h6 className="card-title">{method.name}</h6>
                          {selectedMethod?.id === method.id && (
                            <div className="mt-2">
                              <small className="text-muted">No. Rekening/HP:</small><br/>
                              <strong>{method.account}</strong><br/>
                              <small className="text-muted">a.n. {method.holder}</small>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedMethod && (
                  <div className="mt-3 text-center">
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowProofUpload(true)}
                    >
                      Saya Sudah Bayar
                    </button>
                  </div>
                )}
              </div>
            )}

            {showProofUpload && (
              <div>
                <h6>Upload Bukti Pembayaran</h6>
                <div className="mb-3">
                  <label className="form-label">Metode yang dipilih: <strong>{selectedMethod.name}</strong></label>
                </div>
                <div className="mb-3">
                  <label className="form-label">Bukti Pembayaran (Screenshot/Foto)</label>
                  <input
                    type="file"
                    className="form-control"
                    accept="image/*"
                    onChange={(e) => setProofFile(e.target.files[0])}
                    required
                  />
                </div>
                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-primary"
                    onClick={handleProofUpload}
                    disabled={!proofFile || loading} // <<-- Tambahan: Disable saat loading
                  >
                    {loading ? 'Mengunggah...' : 'Upload Bukti'}
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowProofUpload(false)}
                    disabled={loading} // <<-- Tambahan: Disable saat loading
                  >
                    Kembali
                  </button>
                </div>
              </div>
            )}

            {payment.status === 'pending' && (
              <div className="alert alert-warning">
                <i className="bi bi-clock"></i> Bukti pembayaran sedang diverifikasi admin.
                {payment.bukti_url && (
                    <div className="mt-2">
                      <a href={payment.bukti_url} target="_blank" rel="noopener noreferrer" className="alert-link">
                          Lihat bukti pembayaran
                      </a>
                    </div>
                )}
              </div>
            )}

            {payment.status === 'lunas' && (
              <div className="alert alert-success">
                <i className="bi bi-check-circle"></i> Pembayaran telah lunas.
                {payment.tanggal_bayar && (
                  <div className="mt-1">
                    <small>Tanggal: {new Date(payment.tanggal_bayar).toLocaleDateString('id-ID')}</small>
                  </div>
                )}
                 {payment.bukti_url && (
                    <div className="mt-2">
                      <a href={payment.bukti_url} target="_blank" rel="noopener noreferrer" className="alert-link">
                          Lihat bukti pembayaran
                      </a>
                    </div>
                )}
              </div>
            )}

             {payment.status === 'lunas' && payment.bukti_url && (
              <div className="text-center mt-3">
                <a 
                  href={payment.bukti_url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-outline-info"
                >
                  <i className="bi bi-receipt"></i> Lihat Bukti
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetail;