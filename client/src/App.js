import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import NavBar from './components/NavBar';
import Home from './components/Home';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import ProfilePage from './components/ProfilePage'; // Updated to match actual filename
import AdminUsers from './components/AdminUsers';
import AdminUserScores from './components/AdminUserScores';
import AdminCourses from './components/AdminCourses';
import Courses from './components/CoursesPage';
import Scores from './components/ScoresPage';
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
            <Route path="/courses" element={<Courses />} />
            <Route path="/scores" element={<Scores />} />
            <Route path="/login" element={isAuthenticated ? <Navigate to="/profile" /> : <LoginPage setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/signup" element={isAuthenticated ? <Navigate to="/profile" /> : <SignupPage setIsAuthenticated={setIsAuthenticated} />} />
            <Route path="/profile" element={isAuthenticated ? <ProfilePage /> : <Navigate to="/login" />} />
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