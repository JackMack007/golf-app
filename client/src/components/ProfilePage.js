import React, { useState, useEffect } from 'react';
import { getProfile, updateProfile } from '../services/api';

function ProfilePage() {
  const [profile, setProfile] = useState({ name: '', email: '', handicap: 0 });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session'));
        if (!session || !session.access_token) {
          throw new Error('No session found. Please log in.');
        }
        // Assuming the userId is stored in the session (adjust based on your session structure)
        const userId = session.user.id;
        const response = await getProfile(userId);
        setProfile(response.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      }
    };
    fetchProfile();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session || !session.access_token) {
        throw new Error('No session found. Please log in.');
      }
      await updateProfile(profile);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile((prev) => ({
      ...prev,
      [name]: name === 'handicap' ? parseInt(value) || 0 : value
    }));
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl font-bold mb-6 text-center">Your Profile</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={profile.name}
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
              value={profile.email}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Handicap</label>
            <input
              type="number"
              name="handicap"
              value={profile.handicap}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              min="0"
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