import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_KEY
);

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isSignUp) {
        const { data } = await axios.post('http://localhost:5000/api/auth/signup', {
          email,
          password,
          name
        });
        alert('Sign-up successful! Please log in.');
        setIsSignUp(false);
      } else {
        const { data } = await axios.post('http://localhost:5000/api/auth/login', {
          email,
          password
        });
        localStorage.setItem('session', JSON.stringify(data.session));
        alert('Login successful!');
        navigate('/profile');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:5000/api/auth/logout');
      localStorage.removeItem('session');
      alert('Logged out successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isSignUp ? 'Sign Up' : 'Login'}
        </h2>
        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <div className="mb-4">
              <label className="block text-gray-700">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
          )}
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            {isSignUp ? 'Sign Up' : 'Login'}
          </button>
        </form>
        <button
          onClick={() => setIsSignUp(!isSignUp)}
          className="w-full mt-4 text-blue-500 hover:underline"
        >
          {isSignUp ? 'Switch to Login' : 'Switch to Sign Up'}
        </button>
        {!isSignUp && (
          <>
            <button
              onClick={handleLogout}
              className="w-full mt-4 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
            >
              Logout
            </button>
            <div className="mt-4 text-center">
              <Link to="/profile" className="text-blue-500 hover:underline">
                Go to Profile
              </Link>
            </div>
            <div className="mt-2 text-center">
              <Link to="/courses" className="text-blue-500 hover:underline">
                Go to Courses
              </Link>
            </div>
            <div className="mt-2 text-center">
              <Link to="/scores" className="text-blue-500 hover:underline">
                Go to Scores
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default LoginPage;