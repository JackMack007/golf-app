import React, { useState, useEffect } from 'react';
import { getCourses, updateCourse, createCourse } from '../services/api';

const CoursesPage = () => {
  const [courses, setCourses] = useState([]);
  const [editCourseId, setEditCourseId] = useState(null);
  const [formData, setFormData] = useState(new FormData());
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await getCourses();
        setCourses(response.data.courses || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch courses');
      }
    };
    fetchCourses();
  }, []);

  const handleUpdate = async () => {
    if (!editCourseId) return;
    try {
      const response = await updateCourse(editCourseId, formData);
      setCourses(courses.map(course => course.id === editCourseId ? response.data : course));
      setEditCourseId(null);
      setFormData(new FormData());
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update course');
    }
  };

  const handleCreate = async () => {
    try {
      const response = await createCourse(formData);
      setCourses([...courses, response.data]);
      setFormData(new FormData());
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create course');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    formData.set(name, value);
    setFormData(new FormData(formData));
  };

  return (
    <div>
      <h1>Courses</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <h2>Course List</h2>
      {courses.length > 0 ? (
        courses.map(course => (
          <div key={course.id}>
            <p>{course.name}</p>
            {editCourseId === course.id ? (
              <>
                <input
                  type="text"
                  name="name"
                  placeholder="Course Name"
                  onChange={handleInputChange}
                />
                {/* Add other form fields as needed */}
                <button onClick={handleUpdate}>Save</button>
                <button onClick={() => setEditCourseId(null)}>Cancel</button>
              </>
            ) : (
              <button onClick={() => setEditCourseId(course.id)}>Edit</button>
            )}
          </div>
        ))
      ) : (
        <p>No courses available</p>
      )}
      <h2>Create Course</h2>
      <input
        type="text"
        name="name"
        placeholder="Course Name"
        onChange={handleInputChange}
      />
      {/* Add other form fields as needed */}
      <button onClick={handleCreate}>Create Course</button>
    </div>
  );
};

export default CoursesPage;