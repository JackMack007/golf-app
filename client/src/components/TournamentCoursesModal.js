import React, { useState, useEffect } from 'react';

const TournamentCoursesModal = ({
  tournament,
  courses,
  isOpen,
  onClose,
  fetchAssignedCourses,
  assignedCourses,
  setAssignedCourses,
}) => {
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [playDate, setPlayDate] = useState('');
  const [editingCourseAssignment, setEditingCourseAssignment] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && tournament) {
      fetchAssignedCourses(tournament.tournament_id);
    }
  }, [isOpen, tournament, fetchAssignedCourses]);

  const handleCourseSelectChange = (e) => {
    setSelectedCourseId(e.target.value);
  };

  const handlePlayDateChange = (e) => {
    setPlayDate(e.target.value);
  };

  const handleAssignCourse = async () => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      onClose();
      return;
    }

    if (!selectedCourseId) {
      alert('Please select a course to assign.');
      return;
    }

    if (!playDate || !/^\d{4}-\d{2}-\d{2}$/.test(playDate)) {
      alert('Please select a valid play date (YYYY-MM-DD).');
      return;
    }

    try {
      const response = await fetch('https://golf-app-backend.netlify.app/.netlify/functions/api/tournament-courses', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournament_id: tournament.tournament_id,
          course_id: selectedCourseId,
          play_date: playDate,
        }),
      });

      const data = await response.json();
      console.log('POST /api/tournament-courses response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to assign course to tournament');
      }

      await fetchAssignedCourses(tournament.tournament_id);
      setSelectedCourseId('');
      setPlayDate('');
      alert('Course assigned to tournament successfully!');
    } catch (err) {
      console.error('Error assigning course to tournament:', err);
      setError(`Error: ${err.message}`);
    }
  };

  const handleEditCourseAssignment = (courseAssignment) => {
    setEditingCourseAssignment(courseAssignment);
    setSelectedCourseId(courseAssignment.course_id);
    setPlayDate(courseAssignment.play_date);
  };

  const handleUpdateCourseAssignment = async () => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      onClose();
      return;
    }

    if (!playDate || !/^\d{4}-\d{2}-\d{2}$/.test(playDate)) {
      alert('Please select a valid play date (YYYY-MM-DD).');
      return;
    }

    try {
      const response = await fetch(`https://golf-app-backend.netlify.app/.netlify/functions/api/tournament-courses/${editingCourseAssignment.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          play_date: playDate,
        }),
      });

      const data = await response.json();
      console.log('PUT /api/tournament-courses/:id response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update course assignment');
      }

      await fetchAssignedCourses(tournament.tournament_id);
      setEditingCourseAssignment(null);
      setSelectedCourseId('');
      setPlayDate('');
      alert('Course assignment updated successfully!');
    } catch (err) {
      console.error('Error updating course assignment:', err);
      setError(`Error: ${err.message}`);
    }
  };

  const handleDeleteCourseAssignment = async (courseAssignmentId) => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      return;
    }

    const confirmed = window.confirm('Are you sure you want to remove this course from the tournament?');
    if (!confirmed) return;

    try {
      const response = await fetch(`https://golf-app-backend.netlify.app/.netlify/functions/api/tournament-courses/${courseAssignmentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('DELETE /api/tournament-courses/:id response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete course assignment');
      }

      await fetchAssignedCourses(tournament.tournament_id);
      alert('Course assignment removed successfully!');
    } catch (err) {
      console.error('Error deleting course assignment:', err);
      setError(`Error: ${err.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          Courses for {tournament?.name}
        </h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* List of Assigned Courses */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Assigned Courses</h3>
          {assignedCourses.length > 0 ? (
            <>
              {/* Table layout for medium and larger screens */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border p-2">Course Name</th>
                      <th className="border p-2">Location</th>
                      <th className="border p-2">Play Date</th>
                      <th className="border p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedCourses.map(courseAssignment => (
                      <tr key={courseAssignment.id}>
                        <td className="border p-2">{courseAssignment.courses?.name}</td>
                        <td className="border p-2">{courseAssignment.courses?.location}</td>
                        <td className="border p-2">{courseAssignment.play_date}</td>
                        <td className="border p-2">
                          <button
                            className="text-green-500 hover:underline mr-2"
                            onClick={() => handleEditCourseAssignment(courseAssignment)}
                          >
                            Edit
                          </button>
                          <button
                            className="text-red-500 hover:underline"
                            onClick={() => handleDeleteCourseAssignment(courseAssignment.id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Tile layout for small screens */}
              <div className="block md:hidden space-y-2 max-h-48 overflow-y-auto">
                {assignedCourses.map(courseAssignment => (
                  <div
                    key={courseAssignment.id}
                    className="bg-gray-50 p-4 rounded shadow"
                  >
                    <div className="flex justify-between items-center">
                      <span>
                        {courseAssignment.courses?.name} ({courseAssignment.courses?.location})
                      </span>
                      <div className="space-x-2">
                        <button
                          className="text-green-500 hover:underline"
                          onClick={() => handleEditCourseAssignment(courseAssignment)}
                        >
                          Edit
                        </button>
                        <button
                          className="text-red-500 hover:underline"
                          onClick={() => handleDeleteCourseAssignment(courseAssignment.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">
                      Play Date: {courseAssignment.play_date}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500">No courses assigned yet.</p>
          )}
        </div>

        {/* Add/Edit Course Section */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">
            {editingCourseAssignment ? 'Edit Course Assignment' : 'Add Course'}
          </h3>
          <label className="block text-gray-700">Select Course</label>
          <select
            value={selectedCourseId}
            onChange={handleCourseSelectChange}
            className="w-full p-2 border rounded"
            disabled={!!editingCourseAssignment}
          >
            <option value="">-- Select a course --</option>
            {courses.map(course => (
              <option key={course.course_id} value={course.course_id}>
                {course.name} ({course.location})
              </option>
            ))}
          </select>
          <div className="mt-2">
            <label className="block text-gray-700">Play Date</label>
            <input
              type="date"
              value={playDate}
              onChange={handlePlayDateChange}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
          >
            Close
          </button>
          {editingCourseAssignment ? (
            <button
              onClick={handleUpdateCourseAssignment}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Update
            </button>
          ) : (
            <button
              onClick={handleAssignCourse}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Add Course
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentCoursesModal;