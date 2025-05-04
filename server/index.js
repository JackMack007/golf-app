const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/golf-app/server/.env' });

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

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

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return res.status(400).json({ error: error.message });
  res.json({ user: data.user, session: data.session });
});

app.post('/api/auth/logout', async (req, res) => {
  const { error } = await supabase.auth.signOut();
  if (error) return res.status(400).json({ error: error.message });
  res.json({ message: 'Logged out successfully' });
});

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