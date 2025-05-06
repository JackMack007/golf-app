import React, { useState } from 'react';
import { signup, signin } from '../services/api';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSignup, setIsSignup] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = isSignup
        ? await signup(email, password)
        : await signin(email, password);
      console.log(`${isSignup ? 'Signup' : 'Signin'} successful:`, response.data.user);
      // Redirect or update state (e.g., store user session)
    } catch (err) {
      setError(err.response?.data?.error || `${isSignup ? 'Signup' : 'Signin'} failed`);
    }
  };

  return (
    <div>
      <h1>{isSignup ? 'Sign Up' : 'Sign In'}</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        <button type="submit">{isSignup ? 'Sign Up' : 'Sign In'}</button>
        <button type="button" onClick={() => setIsSignup(!isSignup)}>
          Switch to {isSignup ? 'Sign In' : 'Sign Up'}
        </button>
        {error && <p>{error}</p>}
      </form>
    </div>
  );
};

export default LoginPage;