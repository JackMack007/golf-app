const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/golf-app/server/.env' });

const app = express();

const allowedOrigins = [
  'http://localhost:3000',
  'https://golf-app-frontend-indol.vercel.app/' 
];
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Test endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Auth endpoint: Sign up
app.post('/api/auth/signup', async (req, res) => {
  const { email, password, name } = req.body;
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } }
  });
  if (error) return res.status(400).json({ error: error.message });
  
  const { error: dbError } = await supabase
    .from('users')
    .insert({ user_id: data.user.id, name, email, handicap: 0 });
  
  if (dbError) return res.status(400).json({ error: dbError.message });
  res.json({ user: data.user });
});

// Auth endpoint: Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ user: data.user, session: data.session });
});

// Auth endpoint: Logout
app.post('/api/auth/logout', async (req, res) => {
  const { error } = await supabase.auth.signOut();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Logged out successfully' });
});

// Profile endpoint: Get profile
app.get('/api/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

  const token = authHeader.replace(/^Bearer\s+/i, '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    console.error('getUser error:', error?.message || 'No user found');
    return res.status(401).json({ error: 'Unauthorized', details: error?.message || 'No user found' });
  }

  const { data: profile, error: dbError } = await supabase
    .from('users')
    .select('user_id, name, email, handicap')
    .eq('user_id', user.id)
    .single();

  if (dbError || !profile) return res.status(404).json({ error: 'Profile not found', details: dbError?.message });
  res.json(profile);
});

// Profile endpoint: Update profile
app.put('/api/profile', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

  const { name, email, handicap } = req.body;
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    console.error('getUser error:', error?.message || 'No user found');
    return res.status(401).json({ error: 'Unauthorized', details: error?.message || 'No user found' });
  }

  const { error: dbError } = await supabase
    .from('users')
    .update({ name, email, handicap })
    .eq('user_id', user.id);

  if (dbError) return res.status(400).json({ error: 'Update failed', details: dbError.message });
  res.json({ message: 'Profile updated successfully' });
});

// Course endpoint: Create course
app.post('/api/courses', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

  const { name, location, par, slope_value, course_value } = req.body;
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    console.error('getUser error:', error?.message || 'No user found');
    return res.status(401).json({ error: 'Unauthorized', details: error?.message || 'No user found' });
  }

  const { data, error: dbError } = await supabase
    .from('courses')
    .insert({
      name,
      location,
      par,
      created_by: user.id,
      slope_value,
      course_value
    })
    .select()
    .single();

  if (dbError) return res.status(400).json({ error: 'Failed to create course', details: dbError.message });
  res.json(data);
});

// Course endpoint: Get all courses
app.get('/api/courses', async (req, res) => {
  const { data, error } = await supabase
    .from('courses')
    .select('course_id, name, location, par, created_by, slope_value, course_value, created_at');

  if (error) return res.status(400).json({ error: 'Failed to fetch courses', details: error.message });
  res.json(data);
});

// Course endpoint: Update course
app.put('/api/courses/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

  const { id } = req.params;
  const { name, location, par, slope_value, course_value } = req.body;
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    console.error('getUser error:', error?.message || 'No user found');
    return res.status(401).json({ error: 'Unauthorized', details: error?.message || 'No user found' });
  }

  const { data, error: dbError } = await supabase
    .from('courses')
    .update({ name, location, par, slope_value, course_value })
    .eq('course_id', id)
    .eq('created_by', user.id)
    .select()
    .single();

  if (dbError) return res.status(400).json({ error: 'Failed to update course', details: dbError.message });
  if (!data) return res.status(404).json({ error: 'Course not found or not owned by user' });
  res.json({ message: 'Course updated successfully', data });
});

// Course endpoint: Delete course
app.delete('/api/courses/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

  const { id } = req.params;
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    console.error('getUser error:', error?.message || 'No user found');
    return res.status(401).json({ error: 'Unauthorized', details: error?.message || 'No user found' });
  }

  const { error: dbError } = await supabase
    .from('courses')
    .delete()
    .eq('course_id', id)
    .eq('created_by', user.id);

  if (dbError) return res.status(400).json({ error: 'Failed to delete course', details: dbError.message });
  res.json({ message: 'Course deleted successfully' });
});

// Score endpoint: Create score
app.post('/api/scores', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

  const { course_id, score_value, date_played, notes } = req.body;
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    console.error('getUser error:', error?.message || 'No user found');
    return res.status(401).json({ error: 'Unauthorized', details: error?.message || 'No user found' });
  }

  const { data, error: dbError } = await supabase
    .from('scores')
    .insert({
      user_id: user.id,
      course_id,
      score_value,
      date_played,
      notes
    })
    .select()
    .single();

  if (dbError) return res.status(400).json({ error: 'Failed to create score', details: dbError.message });
  res.json(data);
});

// Score endpoint: Get all scores for user
app.get('/api/scores', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

  const token = authHeader.replace(/^Bearer\s+/i, '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    console.error('getUser error:', error?.message || 'No user found');
    return res.status(401).json({ error: 'Unauthorized', details: error?.message || 'No user found' });
  }

  const { data, error: dbError } = await supabase
    .from('scores')
    .select('score_id, user_id, course_id, score_value, date_played, notes')
    .eq('user_id', user.id);

  if (dbError) return res.status(400).json({ error: 'Failed to fetch scores', details: dbError.message });
  res.json(data);
});

// Score endpoint: Update score
app.put('/api/scores/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

  const { id } = req.params;
  const { course_id, score_value, date_played, notes } = req.body;
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    console.error('getUser error:', error?.message || 'No user found');
    return res.status(401).json({ error: 'Unauthorized', details: error?.message || 'No user found' });
  }

  const { data, error: dbError } = await supabase
    .from('scores')
    .update({ course_id, score_value, date_played, notes })
    .eq('score_id', id)
    .eq('user_id', user architecture: x86_64
  .id)
    .select()
    .single();

  if (dbError) return res.status(400).json({ error: 'Failed to update score', details: dbError.message });
  if (!data) return res.status(404).json({ error: 'Score not found or not owned by user' });
  res.json({ message: 'Score updated successfully', data });
});

// Score endpoint: Delete score
app.delete('/api/scores/:id', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No authorization header' });

  const { id } = req.params;
  const token = authHeader.replace(/^Bearer\s+/i, '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    console.error('getUser error:', error?.message || 'No user found');
    return res.status(401).json({ error: 'Unauthorized', details: error?.message || 'No user found' });
  }

  const { error: dbError } = await supabase
    .from('scores')
    .delete()
    .eq('score_id', id)
    .eq('user_id', user.id);

  if (dbError) return res.status(400).json({ error: 'Failed to delete score', details: dbError.message });
  res.json({ message: 'Score deleted successfully' });
});

// Diagnostic endpoint: Test Supabase connection
app.get('/api/test-supabase', async (req, res) => {
  try {
    const { data, error } = await supabase.from('users').select('user_id').limit(1);
    if (error) throw error;
    res.json({ status: 'Supabase connected', data });
  } catch (error) {
    console.error('Supabase test error:', error.message);
    res.status(500).json({ error: 'Supabase connection failed', details: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));