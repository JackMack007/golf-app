import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    console.log('Interceptor - Starting request for URL:', config.url);
    let session;
    try {
      session = JSON.parse(localStorage.getItem('session'));
      console.log('Interceptor - Session parsed:', session);
    } catch (error) {
      console.error('Interceptor - Failed to parse session from localStorage:', error.message);
      session = null;
    }
    if (session && session.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
      console.log('API request - URL:', config.url, 'Token:', session.access_token);
    } else {
      console.log('API request - URL:', config.url, 'No token found');
    }
    return config;
  },
  (error) => {
    console.error('Interceptor - Request error:', error.message);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('API response - URL:', response.config.url, 'Status:', response.status);
    return response;
  },
  (error) => {
    console.error('API response error - URL:', error.config?.url, 'Status:', error.response?.status, 'Message:', error.response?.data?.error || error.message);
    return Promise.reject(error);
  }
);

export const signup = (email, password, name) => api.post('/api/auth/signup', { email, password, name });

export const signin = (email, password) => api.post('/api/auth/signin', { email, password });

export const getProfile = () => api.get('/api/profile');

export const updateProfile = (name, email, handicap) => api.put('/api/profile', { name, email, handicap });

export const getCourses = () => api.get('/api/courses');

export const submitCourse = (courseData) => api.post('/api/courses', courseData);

export const updateCourse = (courseId, courseData) => api.put(`/api/courses/${courseId}`, courseData);

export const deleteCourse = (courseId) => api.delete(`/api/courses/${courseId}`);

export const getScores = () => api.get('/api/scores');

export const getTournamentScores = (tournamentId) => api.get(`/api/tournament-scores/${tournamentId}`);

export const submitScore = (scoreData) => api.post('/api/scores', scoreData);

export const updateScore = (scoreId, formData) => api.put(`/api/scores/${scoreId}`, formData);

export const deleteScore = (scoreId) => api.delete(`/api/scores/${scoreId}`);