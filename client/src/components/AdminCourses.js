import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';

const AdminCourses = () => {
  const { user, error: contextError } = useContext(UserContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (contextError) {
      setError(contextError);
      setLoading(false);
      return;
    }

    if (!user || user.role !== 'admin') {
      setLoading(false);
      return;
    }

    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      setLoading(false);
      return;
    }

    fetch('https://golf-app-backend.netlify.app/.netlify/functions/api/courses', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => {
        console.log('GET /api/courses response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('GET /api/courses response data:', data);
        if (data.error) {
          setError(data.error);
          setLoading(false);
        } else {
          setCourses(data);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('GET /api/courses fetch error:', err);
        setError('Failed to fetch courses');
        setLoading(false);
      });
  }, [user, contextError]);

  if (contextError) {
    return <div className="container mx-auto p-4">Error: {contextError}</div>;
  }

  if (!user || user.role !== 'admin') {
    return <div className="container mx-auto p-4">Access denied. Admins only.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin: Manage Courses</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
        onClick={() => alert('Create course functionality coming soon!')}
      >
        Add New Course
      </button>
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Name</th>
            <th className="border p-2">Location</th>
            <th className="border p-2">Par</th>
            <th className="border p-2">Slope Value</th>
            <th className="border p-2">Course Value</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {courses.map(course => (
            <tr key={course.course_id}>
              <td className="border p-2">{course.name}</td>
              <td className="border p-2">{course.location}</td>
              <td className="border p-2">{course.par}</td>
              <td className="border p-2">{course.slope_value}</td>
              <td className="border p-2">{course.course_value}</td>
              <td className="border p-2">
                <button
                  className="text-green-500 hover:underline mr-2"
                  onClick={() => alert('Edit course functionality coming soon!')}
                >
                  Edit
                </button>
                <button
                  className="text-red-500 hover:underline"
                  onClick={() => alert('Delete course functionality coming soon!')}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminCourses;