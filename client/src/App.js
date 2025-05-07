import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import NavBar from './components/NavBar';
import LoginPage from './components/LoginPage';
import ProfilePage from './components/ProfilePage';
import CoursesPage from './components/CoursesPage';
import ScoresPage from './components/ScoresPage';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <NavBar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/scores" element={<ScoresPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;