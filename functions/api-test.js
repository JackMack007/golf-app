const express = require('express');
const serverless = require('serverless-http');
console.log('Initializing api-test.js');
try {
  const app = express();
  console.log('Express app created');
  app.get('/api/health', (req, res) => {
    console.log('Handling /api/health request');
    res.json({ status: 'Server is running' });
  });
  console.log('Routes configured');
  module.exports.handler = serverless(app);
  console.log('Handler exported');
} catch (error) {
  console.error('Error in api-test.js:', error.message, error.stack);
  throw error;
}