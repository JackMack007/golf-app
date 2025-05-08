import React, { createContext, useState, useEffect } from 'react';

const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(JSON.parse(localStorage.getItem('session')));

  // Function to fetch user profile
  const fetchUserProfile = (accessToken) => {
    fetch('https://golf-app-backend.netlify.app/.netlify/functions/api/profile', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          console.error('Profile fetch error:', data.error);
          localStorage.removeItem('session');
          setSession(null);
          setUser(null);
        } else {
          setUser(data);
        }
      })
      .catch(err => {
        console.error('Profile fetch error:', err);
        localStorage.removeItem('session');
        setSession(null);
        setUser(null);
      });
  };

  // Initial fetch on mount
  useEffect(() => {
    const storedSession = JSON.parse(localStorage.getItem('session'));
    if (storedSession && storedSession.access_token) {
      fetchUserProfile(storedSession.access_token);
    }
  }, []);

  // Listen for storage changes (e.g., login/logout from another tab)
  useEffect(() => {
    const handleStorageChange = () => {
      const newSession = JSON.parse(localStorage.getItem('session'));
      if (JSON.stringify(newSession) !== JSON.stringify(session)) {
        setSession(newSession);
        if (newSession && newSession.access_token) {
          fetchUserProfile(newSession.access_token);
        } else {
          setUser(null);
        }
      }
    };

    // Add event listener for storage changes
    window.addEventListener('storage', handleStorageChange);

    // Poll localStorage for changes in the same tab
    const interval = setInterval(() => {
      handleStorageChange();
    }, 1000); // Check every second

    // Cleanup on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [session]);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };