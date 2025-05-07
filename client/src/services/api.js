import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8888/.netlify/functions/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const session = JSON.parse(localStorage.getItem('session'));
  if (session && session.access_token) {
    config.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return config;
});

export const signup = (email, password, name) => api.post('/api/auth/signup', { email, password, name });

export const signin = (email, password) => api.post('/api/auth/signin', { email, password });

export const getProfile = () => api.get('/api/profile');

export const updateProfile = (name, email, handicap) => api.put('/api/profile', { name, email, handicap });

export const getCourses = () => api.get('/api/courses');

export const submitCourse = (courseData) => api.post('/api/courses', courseData);

export const updateCourse = (courseId, courseData) => api.put(`/api/courses/${courseId}`, courseData);

export const deleteCourse = (courseId) => api.delete(`/api/courses/${courseId}`);

export const getScores = () => api.get('/api/scores');

export const submitScore = (userId, scoreData) => api.post('/api/scores', { userId, ...scoreData });

export const updateScore = (scoreId, formData) => api.put(`/api/scores/${scoreId}`, formData);

export const deleteScore = (scoreId) => api.delete(`/api/scores/${scoreId}`);