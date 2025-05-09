import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../context/UserContext';

const AdminCourses = () => {
  const { user, error: contextError } = useContext(UserContext);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    par: '',
    slope_value: '',
    course_value: '',
  });

  useEffect(() => {
    if (contextError) {
      setError(contextError);
      setLoading(false);
      return;
    }

    if (!user) {
      setError('Please log in to view courses.');
      setLoading(false);
      return;
    }

    fetchCourses();
  }, [user, contextError]);

  const fetchCourses = () => {
    setLoading(true);
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
  };

  const openCreateModal = () => {
    setFormData({
      name: '',
      location: '',
      par: '',
      slope_value: '',
      course_value: '',
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      location: course.location,
      par: course.par,
      slope_value: course.slope_value,
      course_value: course.course_value,
    });
    setIsEditModalOpen(true);
  };

  const closeModal = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setEditingCourse(null);
    setFormData({
      name: '',
      location: '',
      par: '',
      slope_value: '',
      course_value: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreate = async () => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      closeModal();
      return;
    }

    try {
      const response = await fetch('https://golf-app-backend.netlify.app/.netlify/functions/api/courses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location,
          par: parseInt(formData.par),
          slope_value: parseInt(formData.slope_value),
          course_value: parseInt(formData.course_value),
        }),
      });

      const data = await response.json();
      console.log('POST /api/courses response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create course');
      }

      setCourses(prev => [...prev, data]);
      alert('Course created successfully!');
      closeModal();
    } catch (err) {
      console.error('Error creating course:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleEdit = async () => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      closeModal();
      return;
    }

    try {
      const response = await fetch(`https://golf-app-backend.netlify.app/.netlify/functions/api/courses/${editingCourse.course_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          location: formData.location,
          par: parseInt(formData.par),
          slope_value: parseInt(formData.slope_value),
          course_value: parseInt(formData.course_value),
        }),
      });

      const data = await response.json();
      console.log('PUT /api/courses/:id response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update course');
      }

      setCourses(prev =>
        prev.map(course =>
          course.course_id === editingCourse.course_id
            ? { ...course, ...data }
            : course
        )
      );
      alert('Course updated successfully!');
      closeModal();
    } catch (err) {
      console.error('Error updating course:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (courseId) => {
    const confirmed = window.confirm('Are you sure you want to delete this course? This action cannot be undone.');
    if (!confirmed) return;

    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      return;
    }

    try {
      const response = await fetch(`https://golf-app-backend.netlify.app/.netlify/functions/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('DELETE /api/courses/:id response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete course');
      }

      setCourses(prev => prev.filter(course => course.course_id !== courseId));
      alert('Course deleted successfully!');
    } catch (err) {
      console.error('Error deleting course:', err);
      alert(`Error: ${err.message}`);
    }
  };

  if (contextError) {
    return <div className="container mx-auto p-4">Error: {contextError}</div>;
  }

  if (!user) {
    return <div className="container mx-auto p-4">Please log in to view courses.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Courses</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {user.role === 'admin' && (
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 mb-4"
          onClick={openCreateModal}
        >
          Add New Course
        </button>
      )}
      {courses.length > 0 ? (
        <>
          {/* Table layout for medium and larger screens */}
          <div className="hidden md:block">
            <table className="w-full border-collapse border">
              <thead>
                <tr className="bg-gray-200">
                  <th className="border p-2">Name</th>
                  <th className="border p-2">Location</th>
                  <th className="border p-2">Par</th>
                  <th className="border p-2">Slope Value</th>
                  <th className="border p-2">Course Value</th>
                  {user.role === 'admin' && <th className="border p-2">Actions</th>}
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
                    {user.role === 'admin' && (
                      <td className="border p-2">
                        <button
                          className="text-green-500 hover:underline mr-2"
                          onClick={() => openEditModal(course)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-500 hover:underline"
                          onClick={() => handleDelete(course.course_id)}
                        >
                          Delete
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Card layout for small screens */}
          <div className="block md:hidden space-y-4">
            {courses.map(course => (
              <div key={course.course_id} className="border rounded-lg p-4 bg-white shadow">
                <h3 className="text-lg font-semibold">{course.name}</h3>
                <p><strong>Location:</strong> {course.location}</p>
                <p><strong>Par:</strong> {course.par}</p>
                <p><strong>Slope Value:</strong> {course.slope_value}</p>
                <p><strong>Course Value:</strong> {course.course_value}</p>
                {user.role === 'admin' && (
                  <div className="mt-2 space-x-2">
                    <button
                      className="text-green-500 hover:underline"
                      onClick={() => openEditModal(course)}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-500 hover:underline"
                      onClick={() => handleDelete(course.course_id)}
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      ) : (
        !loading && <p className="text-lg">No courses available.</p>
      )}

      {/* Create Course Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Course</h2>
            <div className="mb-4">
              <label className="block text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Par</label>
              <input
                type="number"
                name="par"
                value={formData.par}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Slope Value</label>
              <input
                type="number"
                name="slope_value"
                value={formData.slope_value}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Course Value</label>
              <input
                type="number"
                name="course_value"
                value={formData.course_value}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeModal}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Course Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Course</h2>
            <div className="mb-4">
              <label className="block text-gray-700">Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Location</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Par</label>
              <input
                type="number"
                name="par"
                value={formData.par}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Slope Value</label>
              <input
                type="number"
                name="slope_value"
                value={formData.slope_value}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Course Value</label>
              <input
                type="number"
                name="course_value"
                value={formData.course_value}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={closeModal}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCourses;