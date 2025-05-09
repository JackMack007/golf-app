import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import ProfilePage from './components/ProfilePage';
import AdminUsers from './components/AdminUsers';
import AdminUserScores from './components/AdminUserScores';
import AdminCourses from './components/AdminCourses';
import CoursesPage from './components/CoursesPage';
import ScoresPage from './components/ScoresPage';
import { UserContext } from './context/UserContext';

const AppRoutes = () => {
  const { user } = useContext(UserContext);

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/courses" element={<CoursesPage />} />
      <Route path="/scores" element={<ScoresPage />} />
      <Route path="/login" element={user ? <Navigate to="/profile" /> : <LoginPage />} />
      <Route path="/signup" element={user ? <Navigate to="/profile" /> : <SignupPage />} />
      <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />
      <Route path="/admin/users" element={<AdminUsers />} />
      <Route path="/admin/users/:userId/scores" element={<AdminUserScores />} />
      <Route path="/admin/courses" element={<AdminCourses />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

export default AppRoutes;