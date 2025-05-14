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

export const signup = (email, password, name) => {
  console.log('signup - Sending request with email:', email);
  return api.post('/api/auth/signup', { email, password, name });
};

export const signin = (email, password) => {
  console.log('signin - Sending request with email:', email);
  return api.post('/api/auth/signin', { email, password });
};

export const getProfile = () => {
  console.log('getProfile - Sending request');
  return api.get('/api/profile');
};

export const updateProfile = (name, email, handicap) => {
  console.log('updateProfile - Sending request with data:', { name, email, handicap });
  return api.put('/api/profile', { name, email, handicap });
};

export const getCourses = () => {
  console.log('getCourses - Sending request');
  return api.get('/api/courses');
};

export const submitCourse = (courseData) => {
  console.log('submitCourse - Sending request with data:', courseData);
  return api.post('/api/courses', courseData);
};

export const updateCourse = (courseId, courseData) => {
  console.log('updateCourse - Sending request with courseId:', courseId, 'data:', courseData);
  return api.put(`/api/courses/${courseId}`, courseData);
};

export const deleteCourse = (courseId) => {
  console.log('deleteCourse - Sending request with courseId:', courseId);
  return api.delete(`/api/courses/${courseId}`);
};

export const getScores = () => {
  console.log('getScores - Sending request');
  return api.get('/api/scores');
};

export const getTournamentScores = (tournamentId) => {
  console.log('getTournamentScores - Sending request with tournamentId:', tournamentId);
  return api.get(`/api/tournament-scores/${tournamentId}`);
};

export const submitScore = (scoreData) => {
  console.log('submitScore - Sending request with data:', scoreData);
  return api.post('/api/scores', scoreData);
};

export const updateScore = (scoreId, formData) => {
  console.log('updateScore - Sending request with scoreId:', scoreId, 'data:', formData);
  return api.put(`/api/scores/${scoreId}`, formData);
};

export const deleteScore = (scoreId) => {
  console.log('deleteScore - Sending request with scoreId:', scoreId);
  return api.delete(`/api/scores/${scoreId}`);
};