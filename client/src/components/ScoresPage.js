import React, { useState, useEffect } from 'react';
import { getScores, submitScore } from '../services/api';

const ScoresPage = ({ userId }) => {
  const [scores, setScores] = useState([]);
  const [score, setScore] = useState('');
  const [course, setCourse] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchScores = async () => {
      try {
        const response = await getScores();
        setScores(response.data.scores || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch scores');
      }
    };
    fetchScores();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await submitScore(userId, parseInt(score), course);
      console.log('Score submitted:', response.data);
      setScores([...scores, response.data.score]);
      setScore('');
      setCourse('');
      setError(null);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit score');
    }
  };

  return (
    <div>
      <h1>Scores</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          value={score}
          onChange={(e) => setScore(e.target.value)}
          placeholder="Score"
          required
        />
        <input
          type="text"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          placeholder="Course"
          required
        />
        <button type="submit">Submit Score</button>
      </form>
      <h2>Your Scores</h2>
      {scores.length > 0 ? (
        scores.map((score, index) => (
          <p key={index}>Score: {score.score}, Course: {score.course}</p>
        ))
      ) : (
        <p>No scores available</p>
      )}
    </div>
  );
};

export default ScoresPage;