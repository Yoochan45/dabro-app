import React from 'react';

const Footer = () => {
  return (
    <footer className="footer py-4 mt-5">
      <div className="container text-center">
        <h5 className="mb-3">
          <i className="bi bi-mortarboard me-2"></i>
          Pesantren Darul Abror
        </h5>
        <p className="text-muted mb-3">
          Sistem Manajemen Pesantren Digital Terpercaya
        </p>
        <div className="d-flex justify-content-center gap-4 mb-3">
          <a href="#" className="text-muted">About</a>
          <a href="#" className="text-muted">Contact</a>
          <a href="#" className="text-muted">Privacy</a>
          <a href="#" className="text-muted">Terms</a>
        </div>
        <p className="text-muted">
          &copy; 2024 Pesantren Darul Abror - Dabro Management System
        </p>
      </div>
    </footer>
  );
};

export default Footer;