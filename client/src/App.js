import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './components/Home';
import Login from './components/Login';
import Signup from './components/Signup';
import Profile from './components/Profile';
import AdminUsers from './components/AdminUsers';
import AdminUserScores from './components/AdminUserScores';
import AdminCourses from './components/AdminCourses';
import { UserProvider } from './context/UserContext';
import './App.css';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const session = JSON.parse(localStorage.getItem('session'));
    setIsAuthenticated(!!session);
  }, []);

  return (
    <UserProvider>
      <Router>
        <div className="App">
          <NavBar setIsAuthenticated={setIsAuthenticated} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={isAuthenticated ? <Navigate to="/profile" /> : <Login setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/signup" element={isAuthenticated ? <Navigate to="/profile" /> : <Signup setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/users/:userId/scores" element={<AdminUserScores />} />
            <Route path="/admin/courses" element={<AdminCourses />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;