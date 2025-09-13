import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const BottomNavbar = () => {
  const { user, isAdmin } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  if (!user) return null;

  return (
    <div className="bottom-navbar d-md-none">
      <div className="bottom-nav-container">
        <Link to="/" className={`bottom-nav-item ${isActive('/') ? 'active' : ''}`}>
          <i className="bi bi-house"></i>
          <span>Home</span>
        </Link>
        
        <Link to="/berita" className={`bottom-nav-item ${isActive('/berita') ? 'active' : ''}`}>
          <i className="bi bi-newspaper"></i>
          <span>Berita</span>
        </Link>
        
        <Link to="/pembayaran" className={`bottom-nav-item ${isActive('/pembayaran') ? 'active' : ''}`}>
          <i className="bi bi-credit-card"></i>
          <span>Bayar</span>
        </Link>
        
        <Link to="/keaktifan" className={`bottom-nav-item ${isActive('/keaktifan') ? 'active' : ''}`}>
          <i className="bi bi-calendar-check"></i>
          <span>Aktif</span>
        </Link>
        
          {isAdmin() && (
          <>
          <Link to="/santri" className={`bottom-nav-item ${isActive('/santri') ? 'active' : ''}`}>
            <i className="bi bi-people"></i>
            <span>Santri</span>
          </Link>
          <Link to="/anggota" className={`bottom-nav-item ${isActive('/anggota') ? 'active' : ''}`}>
            <i className="bi bi-person-badge"></i>
            <span>Anggota</span>
          </Link>
        </>
      )}
      </div>
    </div>
  );
};

export default BottomNavbar;