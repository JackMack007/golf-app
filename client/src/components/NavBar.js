import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

function NavBar() {
  const { user, setUser, refreshUser } = useContext(UserContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('session');
    setUser(null);
    refreshUser(); // Refresh UserContext state after logout
    navigate('/');
  };

  return (
    <nav className="bg-blue-600 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white text-lg font-bold">
          Golf App
        </div>
        <div className="space-x-4">
          <Link to="/courses" className="text-white hover:text-blue-200">
            Courses
          </Link>
          <Link to="/scores" className="text-white hover:text-blue-200">
            Scores
          </Link>
          {user ? (
            <>
              <Link to="/profile" className="text-white hover:text-blue-200">
                Profile
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin/users" className="text-white hover:text-blue-200">
                  Admin: Users
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="text-white hover:text-blue-200"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/signup" className="text-white hover:text-blue-200">
                Sign Up
              </Link>
              <Link to="/" className="text-white hover:text-blue-200">
                Login
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;