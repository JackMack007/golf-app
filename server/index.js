const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Test endpoint to verify server
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Placeholder for Supabase client setup (to be expanded in Step 3)
console.log('Supabase integration to be added in future steps');

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));