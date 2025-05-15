import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { UserContext } from './context/UserContext';
import Home from './components/Home';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import ProfilePage from './components/ProfilePage';
import AdminUsers from './components/AdminUsers';
import AdminUserScores from './components/AdminUserScores';
import AdminCourses from './components/AdminCourses';
import AdminTournaments from './components/AdminTournaments';
import ScoresPage from './components/ScoresPage';

const AppRoutes = () => {
  const { user } = useContext(UserContext);

  console.log('AppRoutes: user =', user);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={user ? <Navigate to="/profile" /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/profile" /> : <SignupPage />} />
      <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
      <Route path="/scores" element={user ? <ScoresPage /> : <Navigate to="/login" />} />
      <Route
        path="/admin/users"
        element={
          user && user.role === 'admin' ? <AdminUsers /> : <Navigate to={user ? "/profile" : "/login"} />
        }
      />
      <Route
        path="/admin/users/:userId/scores"
        element={
          user && user.role === 'admin' ? <AdminUserScores /> : <Navigate to={user ? "/profile" : "/login"} />
        }
      />
      <Route
        path="/admin/courses"
        element={
          user && user.role === 'admin' ? <AdminCourses /> : <Navigate to={user ? "/profile" : "/login"} />
        }
      />
      <Route
        path="/admin/tournaments"
        element={
          user && user.role === 'admin' ? <AdminTournaments /> : <Navigate to={user ? "/profile" : "/login"} />
        }
      />
      <Route path="/test-tournaments" element={<div>Test Tournaments Route</div>} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;