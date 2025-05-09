import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import NavBar from './components/NavBar';
import AppRoutes from './AppRoutes';
import { UserProvider } from './context/UserContext';
import './App.css';

function App() {
  return (
    <UserProvider>
      <Router>
        <div className="App">
          <NavBar />
          <AppRoutes />
        </div>
      </Router>
    </UserProvider>
  );
}

export default App;