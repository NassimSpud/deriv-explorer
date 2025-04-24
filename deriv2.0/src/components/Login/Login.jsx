import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './Login.module.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const verifyDerivToken = async (token) => {
    try {
      const response = await fetch('https://oauth.deriv.com/oauth2/authorize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          grant_type: 'authorization_code',
          token
        })
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to verify token');
      }

      return data;
    } catch (err) {
      console.error('Verification error:', err);
      throw err;
    }
  };

  const handleTokenLogin = async () => {
    setLoading(true);
    setError('');

    try {
      if (!token.trim()) {
        throw new Error('Please enter a valid API token');
      }

      const verification = await verifyDerivToken(token);
      
      if (verification.authorized) {
        localStorage.setItem('derivToken', token);
        localStorage.setItem('accountInfo', JSON.stringify({
          currency: verification.account_list?.[0]?.currency || 'USD',
          accountType: verification.account_list?.[0]?.account_type || 'standard'
        }));
        navigate('/dashboard');
      } else {
        throw new Error('Invalid API token');
      }
    } catch (err) {
      setError(err.message);
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.loginContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>Deriv Earnings Dashboard</h1>
          <p className={styles.subtitle}>View your API token earnings</p>
        </div>
        
        <div className={styles.inputGroup}>
          <div className={styles.inputWrapper}>
            <label htmlFor="tokenInput" className={styles.inputLabel}>
              Deriv API Token
            </label>
            <div className={styles.inputContainer}>
              <input
                id="tokenInput"
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Enter your Deriv API token"
                className={styles.input}
                disabled={loading}
              />
              <button 
                type="button"
                className={styles.toggleVisibility}
                onClick={() => setShowToken(!showToken)}
                disabled={loading}
              >
                {showToken ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
              </button>
            </div>
          </div>

          <button 
            onClick={handleTokenLogin} 
            disabled={loading || !token.trim()}
            className={styles.loginButton}
          >
            {loading ? 'Verifying...' : 'View Earnings'}
          </button>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <svg className={styles.errorIcon} viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
            </svg>
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default Login;