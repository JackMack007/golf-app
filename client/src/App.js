import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { UserProvider } from './context/UserContext';
import NavBar from './components/NavBar';
import Profile from './components/Profile'; // Assumed component
import Login from './components/Login'; // Assumed component
import AdminUsers from './components/AdminUsers';
import AdminUserScores from './components/AdminUserScores';

function App() {
  return (
    <BrowserRouter>
      <UserProvider>
        <div className="min-h-screen bg-gray-100">
          <NavBar />
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/login" element={<Login />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/admin/users/:userId/scores" element={<AdminUserScores />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            {/* Add routes for existing pages */}
            <Route path="/courses" element={<div>Courses Page (Placeholder)</div>} />
            <Route path="/scores" element={<div>Scores Page (Placeholder)</div>} />
            <Route path="/signup" element={<div>Sign Up Page (Placeholder)</div>} />
          </Routes>
        </div>
      </UserProvider>
    </BrowserRouter>
  );
}

export default App;