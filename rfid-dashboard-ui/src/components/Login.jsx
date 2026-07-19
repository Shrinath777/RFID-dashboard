import React, { useState } from 'react';
import { login } from '../services/api';
import '../styles/Login.css';
const Login = ({ onLogin }) => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    console.log('🔐 Attempting login with:', credentials.username);
    
    const result = await login(credentials.username, credentials.password);
    
    console.log('✅ Login API response:', result);
    
    // ✅ FIXED: Check for sessionId instead of token
    if (result.sessionId && result.user) {
      // ✅ FIXED: Store sessionId instead of authToken
      localStorage.setItem('sessionId', result.sessionId);
      localStorage.setItem('user', JSON.stringify(result.user));
      
      console.log('🚀 Calling onLogin with user data...');
      onLogin(result.user);
    } else {
      setError('Login failed: No session received');
      console.error('❌ Login failed - no sessionId in response:', result);
    }
  } catch (err) {
    console.error('❌ Login error:', err);
    setError(err.response?.data?.error || err.response?.data?.message || 'Login failed. Please check your credentials.');
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="login-container-large">
      <div className="login-background-large">
        <div className="bg-particles-large">
          <div className="particle-large"></div>
          <div className="particle-large"></div>
          <div className="particle-large"></div>
          <div className="particle-large"></div>
          <div className="particle-large"></div>
          <div className="particle-large"></div>
        </div>
      </div>
      
      <div className="login-content-large">
        <div className="login-card-large">
          {/* Header */}
          <div className="login-header-large">
            <div className="logo-large">
              <span className="material-icons">admin_panel_settings</span>
              <h1>Smart Access Control</h1>
            </div>
            <p className="login-subtitle-large">Secure RFID Management System</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="login-form-large">
            <div className="form-group-large">
              <div className="input-container-large">
                <input
                  type="text"
                  value={credentials.username}
                  onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                  required
                  disabled={loading}
                  className="form-input-large"
                  placeholder="Enter your username"
                />
                <span className="input-icon-large material-icons">person</span>
              </div>
            </div>

            <div className="form-group-large">
              <div className="input-container-large">
                <input
                  type={showPassword ? "text" : "password"}
                  value={credentials.password}
                  onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                  required
                  disabled={loading}
                  className="form-input-large"
                  placeholder="Enter your password"
                />
                <span className="input-icon-large material-icons">lock</span>
                <button
                  type="button"
                  className="password-toggle-large"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <span className="material-icons">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="error-message-large">
                <span className="material-icons">warning</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit" 
              className={`login-button-large ${loading ? 'loading' : ''}`}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="button-spinner-large"></div>
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span className="material-icons">login</span>
                  <span>Sign In to Dashboard</span>
                </>
              )}
            </button>
          </form>

     
          {/* Footer */}
          <div className="login-footer-large">
            <div className="security-info">
              <span className="material-icons">security</span>
              <span>Protected by JWT Authentication</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;