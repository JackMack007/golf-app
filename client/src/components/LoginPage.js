import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signin } from '../services/api';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const response = await signin(email, password);
      // Construct a simplified session object with the correct role
      const sessionData = {
        user: {
          id: response.data.user.id,
          email: response.data.user.email,
          role: response.data.user.role // Use the role from our user object
        },
        access_token: response.data.session.access_token,
        expires_at: response.data.session.expires_at,
        expires_in: response.data.session.expires_in,
        refresh_token: response.data.session.refresh_token,
        token_type: response.data.session.token_type
      };
      localStorage.setItem('session', JSON.stringify(sessionData));
      alert('Login successful!');
      navigate('/profile');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
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
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;