import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://golf-app-backend.netlify.app/.netlify/functions/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export const checkHealth = () => api.get('/api/health');
export const signup = (email, password) => api.post('/api/auth/signup', { email, password });
export const signin = (email, password) => api.post('/api/auth/signin', { email, password });
export const submitScore = (userId, score, course) => api.post('/api/scores', { userId, score, course });
export const getScores = () => api.get('/api/scores');
export const getCourses = () => api.get('/api/courses');
export const updateCourse = (courseId, formData) => api.put(`/api/courses/${courseId}`, formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
export const createCourse = (formData) => api.post('/api/courses', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});
export const getProfile = (userId) => api.get(`/api/users/${userId}`);