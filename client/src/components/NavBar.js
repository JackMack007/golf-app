import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

function NavBar() {
  const { user, setUser, refreshUser } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    refreshUser(); // Ensure user data is refreshed on mount
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('session');
    setUser(null);
    refreshUser();
    navigate('/');
  };

  if (user === null) {
    return <div className="bg-blue-600 p-4 text-white">Loading...</div>; // Show loading state while user is being fetched
  }

  return (
    <nav className="bg-blue-600 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="text-white text-lg font-bold">
          Golf App
        </div>
        <div className="space-x-4">
          {user && (
            <Link to="/admin/courses" className="text-white hover:text-blue-200">
              Courses
            </Link>
          )}
          <Link to="/scores" className="text-white hover:text-blue-200">
            Scores
          </Link>
          {user ? (
            <>
              <Link to="/profile" className="text-white hover:text-blue-200">
                Profile
              </Link>
              {user.role === 'admin' && (
                <>
                  <Link to="/admin/users" className="text-white hover:text-blue-200">
                    Admin: Users
                  </Link>
                  <Link to="/admin/tournaments" className="text-white hover:text-blue-200">
                    Admin: Tournaments
                  </Link>
                </>
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
              <Link to="/login" className="text-white hover:text-blue-200">
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