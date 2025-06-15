import React, { useState } from 'react';
import './LoginForm.css';

const LoginForm = ({ onLogin, onRegister, onGuestPlay }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError(''); // Clear error when user types
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await onLogin(formData);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = () => {
    onRegister();
  };

  const handleGuestPlay = () => {
    onGuestPlay();
  };

  return (
    <div className="login-overlay">
      <div className="login-container">
        <div className="login-header">
          <h1>KỲ SỬ LẠC HỒNG</h1>
          <p>Vietnamese Historical Board Game</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <h2>Login</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <input
              type="text"
              name="username"
              placeholder="Username or Email"
              value={formData.username}
              onChange={handleInputChange}
              disabled={isLoading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>

          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={handleRegister}
            disabled={isLoading}
          >
            Register
          </button>

          <button 
            type="button" 
            className="btn btn-guest"
            onClick={handleGuestPlay}
            disabled={isLoading}
          >
            Play as Guest
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
