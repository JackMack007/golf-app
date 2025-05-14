import React, { useState, useEffect } from 'react';
import { getTournamentScores, submitScore, deleteScore, getProfile } from '../services/api';

const TournamentScoresModal = ({ tournament, isOpen, onClose }) => {
  const [scores, setScores] = useState([]);
  const [courseId, setCourseId] = useState('');
  const [scoreValue, setScoreValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isUserLoaded, setIsUserLoaded] = useState(false);

  useEffect(() => {
    if (isOpen && tournament) {
      fetchCurrentUser();
    }
  }, [isOpen, tournament]);

  useEffect(() => {
    if (isUserLoaded && isOpen && tournament) {
      fetchScores();
    }
  }, [isUserLoaded, isOpen, tournament]);

  const fetchCurrentUser = async () => {
    try {
      const response = await getProfile();
      setCurrentUserId(response.data.user_id);
      setIsUserLoaded(true);
    } catch (err) {
      setError('Failed to fetch current user: ' + (err.response?.data?.error || err.message));
      setIsUserLoaded(true);
    }
  };

  const fetchScores = async () => {
    setLoading(true);
    try {
      const response = await getTournamentScores(tournament.tournament_id);
      console.log('Tournament scores response:', response.data);
      setScores(Array.isArray(response.data.scores) ? response.data.scores : []);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      console.error('Error fetching tournament scores:', err);
      setLoading(false);
    }
  };

  const handleSubmitScore = async (e) => {
    e.preventDefault();
    setError('');

    if (!courseId || !scoreValue) {
      alert('Please fill in all fields.');
      return;
    }

    if (!currentUserId) {
      alert('User not authenticated.');
      return;
    }

    try {
      await submitScore(currentUserId, {
        score: parseInt(scoreValue),
        course: courseId,
        date_played: new Date().toISOString().split('T')[0], // Current date
        notes: '',
        tournament_id: tournament.tournament_id
      });
      alert('Score submitted successfully!');
      setCourseId('');
      setScoreValue('');
      fetchScores();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  const handleDeleteScore = async (scoreId) => {
    const confirmed = window.confirm('Are you sure you want to delete this score?');
    if (!confirmed) return;

    try {
      await deleteScore(scoreId);
      alert('Score deleted successfully!');
      fetchScores();
    } catch (err) {
      setError(err.response?.data?.error || err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">
          Scores for {tournament?.name}
        </h2>
        {loading && <p>Loading...</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* List of Scores */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Tournament Scores</h3>
          {scores.length > 0 ? (
            <>
              {/* Table layout for medium and larger screens */}
              <div className="hidden md:block">
                <table className="w-full border-collapse border">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="border p-2">User</th>
                      <th className="border p-2">Course</th>
                      <th className="border p-2">Score</th>
                      <th className="border p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.map(score => (
                      <tr key={score.score_id}>
                        <td className="border p-2">{score.user_id}</td>
                        <td className="border p-2">{score.course_id}</td>
                        <td className="border p-2">{score.score_value}</td>
                        <td className="border p-2">
                          {score.user_id === currentUserId && (
                            <button
                              className="text-red-500 hover:underline"
                              onClick={() => handleDeleteScore(score.score_id)}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Tile layout for small screens */}
              <div className="block md:hidden space-y-2 max-h-48 overflow-y-auto">
                {scores.map(score => (
                  <div
                    key={score.score_id}
                    className="bg-gray-50 p-4 rounded shadow"
                  >
                    <div className="flex justify-between items-center">
                      <span>
                        User: {score.user_id}, Course: {score.course_id}
                      </span>
                      {score.user_id === currentUserId && (
                        <button
                          className="text-red-500 hover:underline"
                          onClick={() => handleDeleteScore(score.score_id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Score: {score.score_value}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500">No scores submitted yet for this tournament.</p>
          )}
        </div>

        {/* Submit Score Form */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Submit Tournament Score</h3>
          <form onSubmit={handleSubmitScore}>
            <div className="mb-4">
              <label className="block text-gray-700">Course ID</label>
              <input
                type="text"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter course ID"
                disabled={!isUserLoaded}
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Score</label>
              <input
                type="number"
                value={scoreValue}
                onChange={(e) => setScoreValue(e.target.value)}
                className="w-full p-2 border rounded"
                placeholder="Enter score"
                disabled={!isUserLoaded}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
              >
                Close
              </button>
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                disabled={!isUserLoaded}
              >
                Submit Score
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TournamentScoresModal;