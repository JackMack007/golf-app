import React, { useState, useEffect } from 'react';
import { getCourses, getScores, submitScore, updateScore, deleteScore } from '../services/api';

function ScoresPage() {
  const [scores, setScores] = useState([]);
  const [courses, setCourses] = useState([]);
  const [formData, setFormData] = useState({
    course: '',
    score_value: 0,
    date_played: '',
    notes: ''
  });
  const [editScoreId, setEditScoreId] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const session = JSON.parse(localStorage.getItem('session'));
        if (!session || !session.access_token) {
          throw new Error('No session found. Please log in.');
        }

        // Fetch courses
        const coursesResponse = await getCourses();
        console.log('Courses response:', coursesResponse);
        setCourses(Array.isArray(coursesResponse.data) ? coursesResponse.data : []);

        // Fetch scores
        const scoresResponse = await getScores();
        console.log('Scores response:', scoresResponse);
        setScores(Array.isArray(scoresResponse.data.scores) ? scoresResponse.data.scores : []);
      } catch (err) {
        setError(err.response?.data?.error || err.message);
      }
    };
    fetchData();
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
      if (!formData.course || !formData.score_value || !formData.date_played || !/^\d{4}-\d{2}-\d{2}$/.test(formData.date_played)) {
        throw new Error('Course, score, and a valid date played (YYYY-MM-DD) are required');
      }
      console.log('Submitting formData:', formData, 'editScoreId:', editScoreId);
      let response;
      if (editScoreId) {
        console.log('Updating score with ID:', editScoreId);
        response = await updateScore(editScoreId, {
          course: formData.course,
          score_value: formData.score_value,
          date_played: formData.date_played,
          notes: formData.notes
        });
        setScores(scores.map(score => score.score_id === editScoreId ? response.data.data : score));
        setEditScoreId(null);
        setSuccess('Score updated successfully!');
      } else {
        console.log('Creating new score for user:', session.user.id);
        response = await submitScore(session.user.id, {
          score: parseInt(formData.score_value),
          course: formData.course,
          date_played: formData.date_played,
          notes: formData.notes,
          tournament_id: null // Individual score, no tournament
        });
        setScores([...scores, response.data.score]);
        setSuccess('Score created successfully!');
      }
      setFormData({
        course: '',
        score_value: 0,
        date_played: '',
        notes: ''
      });
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleEdit = (score) => {
    const datePlayed = score.date_played && /^\d{4}-\d{2}-\d{2}$/.test(score.date_played) ? score.date_played : new Date().toISOString().split('T')[0];
    setFormData({
      course: score.course_id || score.course || '',
      score_value: score.score_value || 0,
      date_played: datePlayed,
      notes: score.notes || ''
    });
    setEditScoreId(score.score_id);
  };

  const handleDelete = async (scoreId) => {
    setError(null);
    setSuccess(null);
    try {
      const session = JSON.parse(localStorage.getItem('session'));
      if (!session || !session.access_token) {
        throw new Error('No session found. Please log in.');
      }
      await deleteScore(scoreId);
      setScores(scores.filter(score => score.score_id !== scoreId));
      setSuccess('Score deleted successfully!');
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'score_value' ? parseInt(value) || 0 : value
    }));
  };

  const renderCourseOptions = () => {
    console.log('Courses before map:', courses);
    if (!Array.isArray(courses) || courses.length === 0) {
      return null;
    }
    return courses.map(course => (
      <option key={course.course_id} value={course.course_id}>
        {course.name} ({course.location})
      </option>
    ));
  };

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6 text-center">
          {editScoreId ? 'Edit Score' : 'Record Score'}
        </h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        {success && <p className="text-green-500 mb-4">{success}</p>}
        <form onSubmit={handleSubmit} className="mb-8">
          <div className="mb-4">
            <label className="block text-gray-700">Course</label>
            <select
              name="course"
              value={formData.course}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select a course</option>
              {renderCourseOptions()}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Score</label>
            <input
              type="number"
              name="score_value"
              value={formData.score_value}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              min="0"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Date Played</label>
            <input
              type="date"
              name="date_played"
              value={formData.date_played}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            {editScoreId ? 'Update Score' : 'Create Score'}
          </button>
          {editScoreId && (
            <button
              type="button"
              onClick={() => {
                setEditScoreId(null);
                setFormData({
                  course: '',
                  score_value: 0,
                  date_played: '',
                  notes: ''
                });
              }}
              className="w-full mt-2 bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
            >
              Cancel Edit
            </button>
          )}
        </form>
        <h3 className="text-xl font-bold mb-4">Your Scores</h3>
        {scores.length === 0 ? (
          <p className="text-gray-500">No scores recorded.</p>
        ) : (
          <ul className="space-y-4">
            {scores.map((score) => {
              const course = courses.find(c => c.course_id === (score.course_id || score.course));
              return (
                <li key={score.score_id} className="border p-4 rounded flex justify-between items-center">
                  <div>
                    <h4 className="text-lg font-semibold">
                      {course ? `${course.name} (${course.location})` : 'Unknown Course'}
                    </h4>
                    <p><strong>Score:</strong> {score.score_value}</p>
                    <p><strong>Date Played:</strong> {score.date_played}</p>
                    <p><strong>Tournament:</strong> {score.tournament_id ? `Tournament ID: ${score.tournament_id}` : 'Individual Round'}</p>
                    <p><strong>Notes:</strong> {score.notes || 'None'}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(score)}
                      className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(score.score_id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default ScoresPage;