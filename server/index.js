const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'c:/golf-app/server/.env' });

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
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
  
  // Insert user into users table
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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));