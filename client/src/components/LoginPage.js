import React, { useState } from 'react';
import { signup, signin } from '../services/api';

const LoginPage = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = isSignup
        ? await signup(email, password)
        : await signin(email, password);
      const user = response.data.user;
      console.log(`${isSignup ? 'Signup' : 'Signin'} successful:`, user);
      // Store user data (e.g., in localStorage for basic session management)
      localStorage.setItem('user', JSON.stringify(user));
      // Call onLogin prop to notify parent component (e.g., for navigation)
      if (onLogin) onLogin(user);
      // Reset form
      setEmail('');
      setPassword('');
    } catch (err) {
      setError(err.response?.data?.error || `${isSignup ? 'Signup' : 'Signin'} failed`);
    }
  };

  return (
    <div>
      <h1>{isSignup ? 'Sign Up' : 'Sign In'}</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
          />
        </div>
        <button type="submit">{isSignup ? 'Sign Up' : 'Sign In'}</button>
        <button type="button" onClick={() => setIsSignup(!isSignup)}>
          Switch to {isSignup ? 'Sign In' : 'Sign Up'}
        </button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
};

export default LoginPage;