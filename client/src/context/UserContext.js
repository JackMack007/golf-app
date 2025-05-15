import React, { createContext, useState, useEffect, useCallback } from 'react';
import supabase from '../supabaseClient';
import { getProfile } from '../services/api';

const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  // Function to clear session
  const clearSession = () => {
    console.log('Clearing session from Local Storage');
    console.log('Before clearing session:', localStorage.getItem('session'));
    localStorage.removeItem('session');
    console.log('After clearing session:', localStorage.getItem('session'));
    setSession(null);
    setUser(null);
    setError(null);
  };

  // Function to fetch user profile using api.js
  const fetchUserProfile = async () => {
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
      clearSession();
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
      clearSession();
      return null;
    }
  };

  // Manual refresh function with token refresh handling
  const refreshUser = useCallback(async () => {
    const storedSession = JSON.parse(localStorage.getItem('session'));
    if (storedSession && storedSession.access_token) {
      let success = await fetchUserProfile();
      if (!success) {
        const newAccessToken = await refreshToken();
        if (newAccessToken) {
          success = await fetchUserProfile();
        }
        if (!success) {
          console.log('Profile fetch failed after refresh, clearing session');
          clearSession();
        }
      }
    } else {
      clearSession();
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
          fetchUserProfile();
        } else {
          clearSession();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(() => {
      handleStorageChange();
    }, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [session]);

  return (
    <UserContext.Provider value={{ user, setUser, error, refreshUser, clearSession }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };