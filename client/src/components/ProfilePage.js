import React, { useState, useEffect } from 'react';
import { getProfile } from '../services/api';

const ProfilePage = ({ userId }) => {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await getProfile(userId);
        setProfile(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch profile');
      }
    };
    if (userId) {
      fetchProfile();
    }
  }, [userId]);

  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!profile) return <p>Loading...</p>;

  return (
    <div>
      <h1>Profile</h1>
      <p>Email: {profile.email}</p>
      {/* Adjust fields based on your backend response */}
    </div>
  );
};

export default ProfilePage;