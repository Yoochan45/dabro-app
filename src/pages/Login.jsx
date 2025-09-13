import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    console.log('🔄 Starting login process...');
    console.log('📧 Email:', formData.email);
    
    try {
      const result = await login(formData);
      console.log('✅ Login result:', result);
      
      if (result.success) {
        console.log('🎉 Login successful! Navigating to home...');
        navigate('/', { replace: true });
      } else {
        console.log('❌ Login failed:', result.message);
        setError(result.message || 'Login gagal');
      }
    } catch (error) {
      console.error('💥 Login error:', error);
      setError('Terjadi kesalahan saat login');
    }
    
    setLoading(false);
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="d-flex align-items-center justify-content-center min-vh-100 bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-4">
            <div className="card shadow">
              <div className="card-body p-4">
                <div className="text-center mb-4">
                  <i className="bi bi-mortarboard display-4 text-primary mb-2"></i>
                  <h1 className="h3 fw-bold">DABRO</h1>
                  <p className="text-muted">Masuk ke Sistem Pesantren</p>
                </div>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle"></i> {error}
                  </div>
                )}

                <div>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label">
                      <i className="bi bi-envelope"></i> Email
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      className="form-control"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="mb-3">
                    <label htmlFor="password" className="form-label">
                      <i className="bi bi-lock"></i> Password
                    </label>
                    <div className="position-relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="password"
                        name="password"
                        className="form-control"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                      <i
                        className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'} position-absolute`}
                        style={{
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          cursor: 'pointer',
                          zIndex: 10
                        }}
                        onClick={togglePassword}
                      ></i>
                    </div>
                  </div>

                  <button 
                    type="button" 
                    className="btn btn-primary w-100 mb-3" 
                    disabled={loading}
                    onClick={(e) => {
                      console.log('🖱️ Button clicked!');
                      handleSubmit(e);
                    }}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                        Masuk...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-box-arrow-in-right"></i> Masuk
                      </>
                    )}
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-muted mb-2">
                    Belum punya akun? 
                    <Link to="/register" className="text-dark text-decoration-none ms-1">Daftar di sini</Link>
                  </p>
                  <Link to="/" className="text-muted text-decoration-none">
                    <i className="bi bi-arrow-left"></i> Kembali ke Home
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;