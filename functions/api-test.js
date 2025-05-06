const express = require('express');
const serverless = require('serverless-http');
const app = express();
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running' });
});
module.exports.handler = serverless(app);