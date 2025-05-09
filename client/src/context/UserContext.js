import React, { createContext, useState, useEffect, useCallback } from 'react';

const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(JSON.parse(localStorage.getItem('session')));
  const [error, setError] = useState(null);

  // Function to fetch user profile
  const fetchUserProfile = async (accessToken) => {
    try {
      const response = await fetch('https://golf-app-backend.netlify.app/.netlify/functions/api/profile', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      console.log('fetchUserProfile - Response status:', response.status);
      const data = await response.json();
      console.log('fetchUserProfile - Response data:', data);

      if (data.error) {
        console.error('Profile fetch error:', data.error);
        localStorage.removeItem('session');
        setSession(null);
        setUser(null);
        setError(data.error);
        return false;
      } else {
        setUser(data);
        setError(null);
        return true;
      }
    } catch (err) {
      console.error('Profile fetch error:', err.message);
      localStorage.removeItem('session');
      setSession(null);
      setUser(null);
      setError('Failed to fetch user profile');
      return false;
    }
  };

  // Manual refresh function
  const refreshUser = useCallback(async () => {
    const storedSession = JSON.parse(localStorage.getItem('session'));
    if (storedSession && storedSession.access_token) {
      const success = await fetchUserProfile(storedSession.access_token);
      if (!success) {
        console.log('Token refresh failed, clearing session');
        localStorage.removeItem('session');
        setSession(null);
        setUser(null);
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