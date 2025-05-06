import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://golf-app-backend.netlify.app/.netlify/functions/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add Authorization header if session exists
api.interceptors.request.use((config) => {
  const session = JSON.parse(localStorage.getItem('session'));
  if (session && session.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export const checkHealth = () => api.get('/api/health');
export const signup = (email, password) => api.post('/api/auth/signup', { email, password });
export const signin = (email, password) => api.post('/api/auth/signin', { email, password });
export const submitScore = (userId, score, course) => api.post('/api/scores', { userId, score, course });
export const getScores = () => api.get('/api/scores');
export const getCourses = () => api.get('/api/courses');
export const updateCourse = (courseId, formData) => api.put(`/api/courses/${courseId}`, formData);
export const createCourse = (formData) => api.post('/api/courses', formData);
export const deleteCourse = (courseId) => api.delete(`/api/courses/${courseId}`);
export const getProfile = () => api.get('/api/profile');
export const updateProfile = (profileData) => api.put('/api/profile', profileData);
export const updateScore = (scoreId, scoreData) => api.put(`/api/scores/${scoreId}`, scoreData);
export const deleteScore = (scoreId) => api.delete(`/api/scores/${scoreId}`);