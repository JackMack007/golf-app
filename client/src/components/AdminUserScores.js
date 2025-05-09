import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const AdminUserScores = () => {
  const { userId } = useParams();
  const { user, error: contextError } = useContext(UserContext);
  const [scores, setScores] = useState([]);
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

    fetch(`https://golf-app-backend.netlify.app/.netlify/functions/api/scores`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
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
          setLoading(false);
        } else {
          // Filter scores for the specific user
          const userScores = data.scores.filter(score => score.user_id === userId);
          setScores(userScores);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('GET /api/scores fetch error:', err);
        setError('Failed to fetch scores');
        setLoading(false);
      });
  }, [user, contextError, userId]);

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
                  onClick={() => alert('Edit score functionality coming soon!')}
                >
                  Edit
                </button>
                <button
                  className="text-red-500 hover:underline"
                  onClick={() => alert('Delete score functionality coming soon!')}
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

export default AdminUserScores;