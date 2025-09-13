import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient'; // <<-- Revisi: Impor Supabase Client

const Home = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [beritaTerbaru, setBeritaTerbaru] = useState([]);
  const [loading, setLoading] = useState(true); // <<-- Revisi: Tambah state loading

  // Fungsi untuk mengambil data berita dari Supabase
  const loadBerita = async () => {
    try {
      setLoading(true);
      // Mengambil 10 berita terbaru, status 'publish', diurutkan berdasarkan tanggal terbaru
      const { data, error } = await supabase
        .from('berita')
        .select(`id, judul, gambar_url, created_at`) // <<-- Revisi: Mengambil kolom yang dibutuhkan
        .eq('status', 'publish')
        .order('created_at', { ascending: false })
        .limit(10); // Ambil 10 berita terbaru

      if (error) {
        throw error;
      }
      setBeritaTerbaru(data);
    } catch (error) {
      console.error('Error loading berita:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBerita();
  }, []);

  // Auto slide carousel
  useEffect(() => {
    // Pastikan ada data berita sebelum memulai carousel
    if (beritaTerbaru.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % beritaTerbaru.slice(0, 3).length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [beritaTerbaru]); // <<-- Revisi: Dependensi diubah ke beritaTerbaru

  // Tentukan berita untuk carousel (3 teratas) dan kartu berita (sisanya)
  const heroNews = beritaTerbaru.slice(0, 3);
  const newsCards = beritaTerbaru.slice(3);

  return (
    <div>
      {/* Hero Section */}
      <section className="py-5">
        <div className="container text-center py-5">
          <h1 className="display-4 fw-bold mb-4">Selamat Datang di DABRO</h1>
          <p className="lead text-muted mb-4">Sistem Manajemen Pesantren Darul Abror - Platform digital terpadu untuk mengelola kegiatan pesantren.</p>
          {!user && (
            <div className="d-flex justify-content-center gap-3">
              <button 
                className="btn btn-primary btn-lg"
                onClick={() => navigate('/login')}
              >
                Login
              </button>
              <button 
                className="btn btn-outline-dark btn-lg"
                onClick={() => navigate('/register')}
              >
                Daftar Sekarang
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Hero Carousel */}
      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      ) : (
        heroNews.length > 0 && (
          <section className="hero-carousel position-relative">
            <div className="container h-100">
              <div className="row h-100 align-items-center">
                <div className="col-12">
                  <div className="card border-0 shadow-lg">
                    <div className="row g-0">
                      <div className="col-md-6">
                        <img 
                          src={heroNews[currentSlide].gambar_url} // <<-- Revisi: Gunakan gambar_url
                          className="img-fluid rounded-start h-100" 
                          alt={heroNews[currentSlide].judul}
                          style={{ objectFit: 'cover', height: '300px' }}
                        />
                      </div>
                      <div className="col-md-6">
                        <div className="card-body h-100 d-flex flex-column justify-content-center">
                          <h2 className="card-title fw-bold">{heroNews[currentSlide].judul}</h2>
                          <p className="text-muted mb-3">
                            <i className="bi bi-calendar"></i> {new Date(heroNews[currentSlide].created_at).toLocaleDateString()}
                          </p>
                          <button 
                            className="btn btn-primary"
                            onClick={() => navigate(`/berita/${heroNews[currentSlide].id}`)}
                          >
                            <i className="bi bi-arrow-right"></i> Baca Selengkapnya
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Carousel Indicators */}
                  <div className="text-center mt-3">
                    {heroNews.map((_, index) => (
                      <button
                        key={index}
                        className={`btn btn-sm mx-1 ${index === currentSlide ? 'btn-dark' : 'btn-outline-dark'}`}
                        style={{ width: '12px', height: '12px', borderRadius: '50%', padding: 0 }}
                        onClick={() => setCurrentSlide(index)}
                      ></button>
                    ))}
                  </div>
                  
                  {/* Navigation Arrows */}
                  <button 
                    className="btn btn-dark position-absolute top-50 start-0 translate-middle-y ms-2"
                    style={{ zIndex: 10 }}
                    onClick={() => setCurrentSlide((prev) => prev === 0 ? heroNews.length - 1 : prev - 1)}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <button 
                    className="btn btn-dark position-absolute top-50 end-0 translate-middle-y me-2"
                    style={{ zIndex: 10 }}
                    onClick={() => setCurrentSlide((prev) => (prev + 1) % heroNews.length)}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )
      )}

      {/* Berita Terbaru */}
      <section className="py-5">
        <div className="container">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="fw-bold">Berita Terbaru</h2>
            <button 
              className="btn btn-outline-dark"
              onClick={() => navigate('/berita')}
            >
              Lihat Semua <i className="bi bi-arrow-right"></i>
            </button>
          </div>
          
          {loading ? (
            <div className="text-center">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            newsCards.length > 0 ? (
              <div className="row g-4">
                {newsCards.map((news) => (
                  <div key={news.id} className="col-lg-3 col-md-6">
                    <div className="card news-card h-100">
                      <img src={news.gambar_url} className="card-img-top" alt={news.judul} />
                      <div className="card-body d-flex flex-column">
                        <h6 className="card-title">{news.judul}</h6>
                        <p className="text-muted small mb-2">
                          <i className="bi bi-calendar"></i> {new Date(news.created_at).toLocaleDateString()}
                        </p>
                        <div className="mt-auto">
                          <button 
                            className="btn btn-sm btn-outline-dark"
                            onClick={() => navigate(`/berita/${news.id}`)}
                          >
                            Baca <i className="bi bi-arrow-right"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center mt-5">
                <i className="bi bi-journal-text display-4 text-muted"></i>
                <p className="mt-2 text-muted">Belum ada berita lain yang diterbitkan.</p>
              </div>
            )
          )}
        </div>
      </section>

      {/* Quick Access - Only for logged in users */}
      {user && (
        <section className="py-5 bg-light">
          <div className="container">
            <h2 className="text-center mb-5 fw-bold">Akses Cepat</h2>
            <div className="row g-4">
              <div className="col-md-3">
                <div className="card text-center h-100">
                  <div className="card-body">
                    <i className="bi bi-credit-card display-4 mb-3"></i>
                    <h5 className="card-title">Pembayaran</h5>
                    <p className="card-text text-muted">Cek status pembayaran santri</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => navigate('/pembayaran')}
                    >
                      Akses
                    </button>
                  </div>
                </div>
              </div>
              <div className="col-md-3">
                <div className="card text-center h-100">
                  <div className="card-body">
                    <i className="bi bi-calendar-check display-4 mb-3"></i>
                    <h5 className="card-title">Keaktifan</h5>
                    <p className="card-text text-muted">Pantau keaktifan santri</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => navigate('/keaktifan')}
                    >
                      Akses
                    </button>
                  </div>
                </div>
              </div>
              {isAdmin() && (
                <div className="col-md-3">
                  <div className="card text-center h-100">
                    <div className="card-body">
                      <i className="bi bi-people display-4 mb-3"></i>
                      <h5 className="card-title">Data Santri</h5>
                      <p className="card-text text-muted">Kelola data santri</p>
                      <button 
                        className="btn btn-primary"
                        onClick={() => navigate('/santri')}
                      >
                        Akses
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <div className="col-md-3">
                <div className="card text-center h-100">
                  <div className="card-body">
                    <i className="bi bi-chat-dots display-4 mb-3"></i>
                    <h5 className="card-title">Customer Service</h5>
                    <p className="card-text text-muted">Hubungi admin pesantren</p>
                    <button 
                      className="btn btn-primary"
                      onClick={() => navigate('/chat')}
                    >
                      Chat
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;