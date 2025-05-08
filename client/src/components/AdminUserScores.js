import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { UserContext } from '../context/UserContext';

const AdminUserScores = () => {
  const { user } = useContext(UserContext);
  const { userId } = useParams();
  const [scores, setScores] = useState([]);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      return;
    }
    const session = JSON.parse(localStorage.getItem('session'));
    // Fetch user details
    fetch(`https://golf-app-backend.netlify.app/.netlify/functions/api/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setUserDetails(data);
          // Fetch scores for the user
          fetch('https://golf-app-backend.netlify.app/.netlify/functions/api/scores', {
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          })
            .then(res => res.json())
            .then(data => {
              if (data.error) {
                setError(data.error);
              } else {
                const userScores = data.scores.filter(score => score.user_id === userId);
                setScores(userScores);
              }
              setLoading(false);
            })
            .catch(err => {
              setError('Failed to fetch scores');
              setLoading(false);
            });
        }
      })
      .catch(err => {
        setError('Failed to fetch user details');
        setLoading(false);
      });
  }, [user, userId]);

  if (!user || user.role !== 'admin') {
    return <div className="container mx-auto p-4">Access denied. Admins only.</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">
        Admin: Scores for {userDetails ? userDetails.email : 'User'}
      </h1>
      {loading && <p>Loading...</p>}
      {error && <p className="text-red-500 mb-4">{error}</p>}
      <table className="w-full border-collapse border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Score</th>
            <th className="border p-2">Course ID</th>
            <th className="border p-2">Date Played</th>
            <th className="border p-2">Notes</th>
          </tr>
        </thead>
        <tbody>
          {scores.map(score => (
            <tr key={score.score_id}>
              <td className="border p-2">{score.score_value}</td>
              <td className="border p-2">{score.course_id}</td>
              <td className="border p-2">{score.date_played}</td>
              <td className="border p-2">{score.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminUserScores;