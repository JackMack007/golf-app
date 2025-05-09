import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const AdminUserScores = () => {
  const { userId } = useParams();
  const { user, error: contextError } = useContext(UserContext);
  const [scores, setScores] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScore, setEditingScore] = useState(null);
  const [formData, setFormData] = useState({ score_value: '', course_id: '', date_played: '', notes: '' });

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

    // Fetch scores
    fetchScores(session.access_token);

    // Fetch courses
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
        } else {
          setCourses(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('GET /api/courses fetch error:', err);
        setError('Failed to fetch courses');
        setLoading(false);
      });
  }, [user, contextError, userId]);

  const fetchScores = (token) => {
    setLoading(true);
    fetch('https://golf-app-backend.netlify.app/.netlify/functions/api/scores', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => {
        console.log('GET /api/scores response status:', res.status);
        return res.json();
      })
      .then(data => {
        console.log('GET /api/scores response data:', data);
        if (data.error) {
          setError(data.error);
        } else {
          const userScores = data.scores.filter(score => score.user_id === userId);
          setScores(userScores);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('GET /api/scores fetch error:', err);
        setError('Failed to fetch scores');
        setLoading(false);
      });
  };

  const openEditModal = (score) => {
    setEditingScore(score);
    setFormData({
      score_value: score.score_value,
      course_id: score.course_id,
      date_played: score.date_played,
      notes: score.notes || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingScore(null);
    setFormData({ score_value: '', course_id: '', date_played: '', notes: '' });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      closeModal();
      return;
    }

    try {
      const response = await fetch(`https://golf-app-backend.netlify.app/.netlify/functions/api/scores/${editingScore.score_id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          course: formData.course_id,
          score_value: parseInt(formData.score_value),
          date_played: formData.date_played,
          notes: formData.notes,
        }),
      });

      const data = await response.json();
      console.log('PUT /api/scores/:id response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update score');
      }

      // Update the local scores state with the updated score
      setScores(prevScores =>
        prevScores.map(s =>
          s.score_id === editingScore.score_id
            ? { ...s, score_value: parseInt(formData.score_value), course_id: formData.course_id, date_played: formData.date_played, notes: formData.notes }
            : s
        )
      );

      alert('Score updated successfully!');
      closeModal();
    } catch (err) {
      console.error('Error updating score:', err);
      alert(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (scoreId) => {
    const confirmed = window.confirm('Are you sure you want to delete this score? This action cannot be undone.');
    if (!confirmed) return;

    const session = JSON.parse(localStorage.getItem('session'));
    if (!session || !session.access_token) {
      setError('No valid session token found');
      return;
    }

    try {
      const response = await fetch(`https://golf-app-backend.netlify.app/.netlify/functions/api/scores/${scoreId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      console.log('DELETE /api/scores/:id response:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete score');
      }

      // Remove the score from the local state
      setScores(prevScores => prevScores.filter(s => s.score_id !== scoreId));
      alert('Score deleted successfully!');
    } catch (err) {
      console.error('Error deleting score:', err);
      alert(`Error: ${err.message}`);
    }
  };

  if (contextError) {
    return <div className="container mx-auto p-4">Error: {contextError}</div>;
  }

  if (!user || user.role !== 'admin') {
    return <div className="container mx-auto p-4">Access denied. Admins only.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Admin: User Scores</h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Score</th>
            <th className="border p-2">Course ID</th>
            <th className="border p-2">Date Played</th>
            <th className="border p-2">Notes</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {scores.map(score => (
            <tr key={score.score_id}>
              <td className="border p-2">{score.score_value}</td>
              <td className="border p-2">{score.course_id}</td>
              <td className="border p-2">{score.date_played}</td>
              <td className="border p-2">{score.notes || 'N/A'}</td>
              <td className="border p-2">
                <button
                  className="text-green-500 hover:underline mr-2"
                  onClick={() => openEditModal(score)}
                >
                  Edit
                </button>
                <button
                  className="text-red-500 hover:underline"
                  onClick={() => handleDelete(score.score_id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Score Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Edit Score</h2>
            <div className="mb-4">
              <label className="block text-gray-700">Score Value</label>
              <input
                type="number"
                name="score_value"
                value={formData.score_value}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                min="0"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Course</label>
              <select
                name="course_id"
                value={formData.course_id}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              >
                <option value="">Select a course</option>
                {courses.map(course => (
                  <option key={course.course_id} value={course.course_id}>
                    {course.name} (ID: {course.course_id})
                  </option>
                ))}
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Date Played</label>
              <input
                type="date"
                name="date_played"
                value={formData.date_played}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                className="w-full p-2 border rounded"
                rows="3"
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
                onClick={handleSave}
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

export default AdminUserScores;