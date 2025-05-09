import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const Home = () => {
  const { user } = useContext(UserContext);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Welcome to Golf App</h1>
      <p className="text-lg mb-4">
        Track your golf scores, manage courses, and compete with friends!
      </p>
      {!user && (
        <div className="space-x-4">
          <Link to="/login" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Login
          </Link>
          <Link to="/signup" className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
            Sign Up
          </Link>
        </div>
      )}
    </div>
  );
};

export default Home;