import React, { createContext, useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import { getProfile } from '../services/api';

const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(JSON.parse(localStorage.getItem('session')));
  const [error, setError] = useState(null);

  // Initialize Supabase client for token refresh
  const supabase = createClient(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_KEY
  );

  // Function to fetch user profile using api.js
  const fetchUserProfile = async (accessToken) => {
    try {
      const response = await getProfile();
      console.log('fetchUserProfile - Response status:', response.status);
      console.log('fetchUserProfile - Response data:', response.data);

      if (response.status !== 200) {
        throw new Error(response.data.error || 'Failed to fetch profile');
      }

      setUser(response.data);
      setError(null);
      return true;
    } catch (err) {
      console.error('Profile fetch error:', err.message);
      return false;
    }
  };

  // Function to refresh the access token
  const refreshToken = async () => {
    try {
      const storedSession = JSON.parse(localStorage.getItem('session'));
      if (!storedSession || !storedSession.refresh_token) {
        throw new Error('No refresh token available');
      }
      const { data, error } = await supabase.auth.refreshSession({ refresh_token: storedSession.refresh_token });
      if (error) {
        throw new Error(error.message);
      }
      console.log('Token refreshed successfully:', data.session);
      localStorage.setItem('session', JSON.stringify(data.session));
      setSession(data.session);
      return data.session.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error.message);
      return null;
    }
  };

  // Manual refresh function with token refresh handling
  const refreshUser = useCallback(async () => {
    let storedSession = JSON.parse(localStorage.getItem('session'));
    if (storedSession && storedSession.access_token) {
      let success = await fetchUserProfile(storedSession.access_token);
      if (!success) {
        // Attempt to refresh the token
        const newAccessToken = await refreshToken();
        if (newAccessToken) {
          success = await fetchUserProfile(newAccessToken);
        }
        if (!success) {
          console.log('Profile fetch failed after refresh, clearing session');
          localStorage.removeItem('session');
          setSession(null);
          setUser(null);
          setError('Failed to fetch user profile');
        }
      }
    } else {
      setUser(null);
      setError(null);
    }
  }, []);

  // Initial fetch on mount
  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  // Listen for storage changes and manual refresh
  useEffect(() => {
    const handleStorageChange = () => {
      const newSession = JSON.parse(localStorage.getItem('session'));
      if (JSON.stringify(newSession) !== JSON.stringify(session)) {
        console.log('Session changed, refreshing user profile');
        setSession(newSession);
        if (newSession && newSession.access_token) {
          fetchUserProfile(newSession.access_token);
        } else {
          setUser(null);
          setError(null);
        }
      }
    };

    // Add event listener for storage changes (cross-tab)
    window.addEventListener('storage', handleStorageChange);

    // Poll localStorage for changes in the same tab
    const interval = setInterval(() => {
      handleStorageChange();
    }, 1000);

    // Cleanup on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [session]);

  return (
    <UserContext.Provider value={{ user, setUser, error, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };