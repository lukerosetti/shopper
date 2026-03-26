import React, { useState } from 'react';
import { login } from './api';

function Login({ onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    setError('');

    try {
      const token = await login(pin);
      localStorage.setItem('shopperToken', token);
      onLogin(token);
    } catch (err) {
      setError('Invalid PIN. Try again.');
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen">
      <div className="login-card">
        <h1 className="login-title">Shopper <span className="header-tag">AI</span></h1>
        <p className="login-subtitle">Enter your PIN to continue</p>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="PIN"
            className="login-input"
            autoFocus
            disabled={loading}
          />
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="login-btn" disabled={!pin.trim() || loading}>
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
