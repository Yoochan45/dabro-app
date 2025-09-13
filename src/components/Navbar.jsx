import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import BottomNavbar from './BottomNavbar';

const Navbar = () => {
  const { user, logout, isAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState(null);
  const [isMobileApp, setIsMobileApp] = useState(false);

  const isActive = (path) => location.pathname === path;

  useEffect(() => {
    if (user) {
      loadUserProfile();
    }
    // Detect if running in mobile app (PWA or Cordova/Capacitor)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isInApp = window.navigator.standalone || 
                    document.referrer.includes('android-app://') ||
                    window.location.search.includes('app=true');
    setIsMobileApp(isStandalone || isInApp);
  }, [user]);

  const loadUserProfile = async () => {
    try {
      const response = await fetch('http://localhost:3002/api/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
    <nav className={`navbar navbar-expand-lg navbar-dark ${isMobileApp ? 'd-none d-md-block' : ''}`}>
      <div className="container-fluid px-4">
        <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
          <i className="bi bi-mortarboard me-2"></i>
          DABRO
        </Link>
        
        <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
          <span className="navbar-toggler-icon"></span>
        </button>
        
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/') ? 'active' : ''}`} to="/">
                <i className="bi bi-house"></i> Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/berita') ? 'active' : ''}`} to="/berita">
                <i className="bi bi-newspaper"></i> Berita
              </Link>
            </li>
            {user && (
            <>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/pembayaran') ? 'active' : ''}`} to="/pembayaran">
                <i className="bi bi-credit-card"></i> Pembayaran
              </Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive('/keaktifan') ? 'active' : ''}`} to="/keaktifan">
                <i className="bi bi-calendar-check"></i> Keaktifan
              </Link>
            </li>
            {isAdmin() && (
              <>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/santri') ? 'active' : ''}`} to="/santri">
                    <i className="bi bi-people"></i> Santri
                  </Link>
                </li>
                <li className="nav-item">
                  <Link className={`nav-link ${isActive('/anggota') ? 'active' : ''}`} to="/anggota">
                    <i className="bi bi-person-badge"></i> Anggota
                  </Link>
                </li>
              </>
            )}
          </>
        )}
        </ul>
          
          <div className="d-flex align-items-center gap-2">
            {user && (
              <Link to={isAdmin() ? "/admin-chat" : "/chat"} className="btn btn-outline-light btn-chat">
                <i className="bi bi-chat-dots me-2"></i> {isAdmin() ? 'Chat Admin' : 'Chat CS'}
              </Link>
            )}
            
            {user ? (
              <div className="dropdown">
                <button className="btn btn-outline-light dropdown-toggle d-flex align-items-center" type="button" data-bs-toggle="dropdown">
                  {userProfile?.foto ? (
                    <img 
                      src={`http://localhost:3002/uploads/${userProfile.foto}`} 
                      alt={user.nama}
                      className="rounded-circle me-2"
                      style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'inline';
                      }}
                    />
                  ) : null}
                  <i className={`bi bi-person-circle me-1 ${userProfile?.foto ? 'd-none' : ''}`}></i>
                  <span>{user.nama}</span>
                </button>
                <ul className="dropdown-menu">
                  <li><Link className="dropdown-item" to="/profile"><i className="bi bi-person"></i> Profil</Link></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><button className="dropdown-item" onClick={handleLogout}><i className="bi bi-box-arrow-right"></i> Logout</button></li>
                </ul>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-primary">
                  <i className="bi bi-box-arrow-in-right"></i> Login
                </Link>
                <Link to="/register" className="btn btn-outline-light">
                  <i className="bi bi-person-plus"></i> Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
    {isMobileApp && <BottomNavbar />}
    </>
  );
};

export default Navbar;