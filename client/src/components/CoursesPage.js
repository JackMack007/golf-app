import React, { useState, useEffect } from 'react';
import { getCourses, submitCourse, updateCourse, deleteCourse } from '../services/api';

function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    par: '',
    slope_value: '',
    course_value: ''
  });
  const [editCourseId, setEditCourseId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session'));
        if (!session || !session.access_token) {
          throw new Error('No session found. Please log in.');
        }
        const response = await getCourses();
        setCourses(response.data);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
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
      let response;
      if (editCourseId) {
        // Update existing course
        response = await updateCourse(editCourseId, {
          name: formData.name,
          location: formData.location,
          par: parseInt(formData.par),
          slope_value: parseInt(formData.slope_value),
          course_value: parseFloat(formData.course_value)
        });
        setCourses(courses.map(course => course.course_id === editCourseId ? response.data.data : course));
        setEditCourseId(null);
        setSuccess('Course updated successfully!');
      } else {
        // Create new course
        response = await submitCourse({
          name: formData.name,
          location: formData.location,
          par: parseInt(formData.par),
          slope_value: parseInt(formData.slope_value),
          course_value: parseFloat(formData.course_value)
        });
        setCourses([...courses, response.data]);
        setSuccess('Course created successfully!');
      }
      setFormData({
        name: '',
        location: '',
        par: '',
        slope_value: '',
        course_value: ''
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleEdit = (course) => {
    setFormData({
      name: course.name,
      location: course.location,
      par: course.par,
      slope_value: course.slope_value,
      course_value: course.course_value
    });
    setEditCourseId(course.course_id);
  };

  const handleDelete = async (courseId) => {
    setError(null);
    setSuccess(null);
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session || !session.access_token) {
        throw new Error('No session found. Please log in.');
      }
      await deleteCourse(courseId);
      setCourses(courses.filter(course => course.course_id !== courseId));
      setSuccess('Course deleted successfully!');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {editCourseId ? 'Edit Course' : 'Create Course'}
        </h2>
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
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Course Value</label>
            <input
              type="number"
              step="0.1"
              name="course_value"
              value={formData.course_value}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            {editCourseId ? 'Update Course' : 'Create Course'}
          </button>
          {editCourseId && (
            <button
              type="button"
              onClick={() => {
                setEditCourseId(null);
                setFormData({
                  name: '',
                  location: '',
                  par: '',
                  slope_value: '',
                  course_value: ''
                });
              }}
              className="w-full mt-2 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
            >
              Cancel Edit
            </button>
          )}
        </form>
        <h3 className="text-xl font-bold mb-4">Courses</h3>
        {courses.length === 0 ? (
          <p className="text-gray-500">No courses available.</p>
        ) : (
          <ul className="space-y-4">
            {courses.map((course) => (
              <li key={course.course_id} className="border p-4 rounded flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-semibold">{course.name}</h4>
                  <p><strong>Location:</strong> {course.location}</p>
                  <p><strong>Par:</strong> {course.par}</p>
                  <p><strong>Slope Value:</strong> {course.slope_value}</p>
                  <p><strong>Course Value:</strong> {course.course_value}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(course)}
                    className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(course.course_id)}
                    className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default CoursesPage;