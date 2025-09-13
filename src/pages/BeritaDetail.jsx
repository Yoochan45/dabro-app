import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient'; // <<-- Revisi: Impor Supabase Client

const BeritaDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [berita, setBerita] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBerita();
  }, [id]);

  const loadBerita = async () => {
    try {
      // <<-- Revisi: Mengganti fetch dengan Supabase
      const { data, error } = await supabase
        .from('berita')
        .select(`
          id, judul, konten, status, created_at, gambar_url,
          admin_profile:admin_id(nama) // <<-- Mengambil nama admin
        `)
        .eq('id', id)
        .single(); // <<-- Ambil hanya satu data

      if (error) {
        throw error;
      }

      setBerita(data);
    } catch (error) {
      console.error('Error loading berita:', error);
      // Jika data tidak ditemukan, navigasi kembali
      navigate('/berita');
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

  if (!berita) {
    return (
      <div className="container py-5 text-center">
        <h3>Berita tidak ditemukan</h3>
        <button className="btn btn-primary mt-3" onClick={() => navigate('/berita')}>
          Kembali ke Berita
        </button>
      </div>
    );
  }

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-8">
          <div className="card">
            {/* <<-- Revisi: Gunakan gambar_url dari Supabase Storage */}
            <img 
              src={berita.gambar_url}
              className="card-img-top" 
              alt={berita.judul}
              style={{ height: '400px', objectFit: 'cover' }}
            />
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <small className="text-muted">
                  <i className="bi bi-calendar me-1"></i>
                  {new Date(berita.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </small>
                <small className="text-muted">
                  <i className="bi bi-person me-1"></i>
                  {berita.admin_profile.nama}
                </small>
              </div>
              
              <h1 className="card-title fw-bold mb-4">{berita.judul}</h1>
              
              <div className="card-text" style={{ lineHeight: '1.8', fontSize: '1.1rem' }}>
                {berita.konten.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-3">{paragraph}</p>
                ))}
              </div>
              
              <div className="mt-4 pt-3 border-top">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <small className="text-muted">
                      {/* Supabase tidak otomatis melacak views, perlu kolom views di tabel */}
                      <i className="bi bi-eye me-1"></i>
                      {berita.views || 0} views
                    </small>
                  </div>
                  <button 
                    className="btn btn-outline-primary"
                    onClick={() => navigate('/berita')}
                  >
                    <i className="bi bi-arrow-left me-1"></i>
                    Kembali ke Berita
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BeritaDetail;