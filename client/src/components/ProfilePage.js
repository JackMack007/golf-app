import React, { useState, useEffect, useContext } from 'react';
import { getProfile, updateProfile } from '../services/api';
import { UserContext } from '../context/UserContext';

function ProfilePage() {
  const { user, refreshUser } = useContext(UserContext);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    handicap: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const response = await getProfile();
        setFormData({
          name: response.data.name || '',
          email: response.data.email || '',
          handicap: response.data.handicap || 0
        });
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
        setLoading(false);
      }
    };

    // Pre-fill form with user data from context if available
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        handicap: user.handicap || 0
      });
      setLoading(false);
    } else {
      fetchProfile();
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const response = await updateProfile(formData.name, formData.email, parseFloat(formData.handicap));
      setSuccess('Profile updated successfully!');
      setFormData({
        name: response.data.name || '',
        email: response.data.email || '',
        handicap: response.data.handicap || 0
      });
      // Refresh user context after update
      await refreshUser();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-6 text-center">Profile</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Handicap</label>
            <input
              type="number"
              step="0.1"
              name="handicap"
              value={formData.handicap}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Update Profile
          </button>
        </form>
      </div>
    </div>
  );
}

export default ProfilePage;