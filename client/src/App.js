import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import NavBar from './components/NavBar';
import ProfilePage from './components/ProfilePage';
import LoginPage from './components/LoginPage';
import CoursesPage from './components/CoursesPage';
import ScoresPage from './components/ScoresPage';
import SignupPage from './components/SignupPage';
import AdminUsers from './components/AdminUsers';
import AdminUserScores from './components/AdminUserScores';

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <div className="min-h-screen bg-gray-100">
          <NavBar />
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/scores" element={<ScoresPage />} />
            <Route path="/admin/users/:userId/scores" element={<AdminUserScores />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Routes>
        </div>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;