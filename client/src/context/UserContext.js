import React, { createContext, useState, useEffect } from 'react';

const UserContext = createContext();

const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (session && session.access_token) {
      fetch('https://golf-app-backend.netlify.app/.netlify/functions/api/profile', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      })
        .then(res => res.json())
        .then(data => {
          if (data.error) {
            console.error('Profile fetch error:', data.error);
            localStorage.removeItem('session');
            setUser(null);
          } else {
            setUser(data);
          }
        })
        .catch(err => {
          console.error('Profile fetch error:', err);
          localStorage.removeItem('session');
          setUser(null);
        });
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

export { UserContext, UserProvider };