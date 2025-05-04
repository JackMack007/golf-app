import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    par: 72,
    slope_value: 113,
    course_value: 72.5
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/courses');
        setCourses(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch courses');
      }
    };
    fetchCourses();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session || !session.access_token) {
        throw new Error('No session found. Please log in.');
      }
      const response = await axios.post('http://localhost:5000/api/courses', formData, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      setCourses([...courses, response.data]);
      setSuccess('Course created successfully!');
      setFormData({
        name: '',
        location: '',
        par: 72,
        slope_value: 113,
        course_value: 72.5
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'par' || name === 'slope_value' ? parseInt(value) || 0 : name === 'course_value' ? parseFloat(value) || 0 : value
    }));
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center">Manage Golf Courses</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-4">
            <label className="block text-gray-700">Course Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Location</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Par</label>
            <input
              type="number"
              name="par"
              value={formData.par}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              min="0"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Slope Value</label>
            <input
              type="number"
              name="slope_value"
              value={formData.slope_value}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              min="0"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Course Value</label>
            <input
              type="number"
              name="course_value"
              value={formData.course_value}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              step="0.1"
              min="0"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Create Course
          </button>
        </form>
        <h3 className="text-xl font-bold mb-4">All Courses</h3>
        {courses.length === 0 ? (
          <p className="text-gray-500">No courses available.</p>
        ) : (
          <ul className="space-y-4">
            {courses.map((course) => (
              <li key={course.course_id} className="border p-4 rounded">
                <h4 className="text-lg font-semibold">{course.name}</h4>
                <p><strong>Location:</strong> {course.location}</p>
                <p><strong>Par:</strong> {course.par}</p>
                <p><strong>Slope Value:</strong> {course.slope_value}</p>
                <p><strong>Course Value:</strong> {course.course_value}</p>
                <p><strong>Created By:</strong> {course.created_by}</p>
                <p><strong>Created At:</strong> {new Date(course.created_at).toLocaleString()}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default CoursesPage;