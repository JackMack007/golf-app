const { corsHeaders, checkUserRole, initializeSupabase } = require('./routes/utils');
const authRoutes = require('./routes/auth');
const scoresRoutes = require('./routes/scores');
const usersRoutes = require('./routes/users');
const coursesRoutes = require('./routes/courses');
const tournamentsRoutes = require('./routes/tournaments');
const leaderboardsRoutes = require('./routes/leaderboards');
const notFoundRoutes = require('./routes/not-found');

exports.handler = async function(event, context) {
  console.log('Handling API request:', event.path, event.httpMethod);
  console.log('Raw event.path:', event.path);
  console.log('Event headers:', event.headers);

  // Initialize Supabase client
  let supabase;
  try {
    supabase = initializeSupabase();
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Server error: Failed to initialize database client' })
    };
  }

  // Handle OPTIONS preflight request
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const path = event.path
      .replace(/^\/\.netlify\/functions\/api\/?/, '/api/')
      .replace(/^\/api\/api\/?/, '/api/')
      .replace(/^\/+/, '/')
      .replace(/\/+$/, '');
    console.log('Normalized path in api.js:', path);

    // Route to appropriate handler based on path
    if (path.startsWith('/api/auth')) {
      return await authRoutes(event, supabase);
    }
    if (path.startsWith('/api/scores')) {
      return await scoresRoutes(event, supabase);
    }
    if (path.startsWith('/api/users') || path === '/api/profile') {
      return await usersRoutes(event, supabase);
    }
    if (path.startsWith('/api/courses')) {
      return await coursesRoutes(event, supabase);
    }
    if (path.startsWith('/api/tournaments') || path.startsWith('/api/tournament-participants') || path.startsWith('/api/tournament-courses')) {
      return await tournamentsRoutes(event, supabase);
    }
    if (path === '/api/leaderboards') {
      return await leaderboardsRoutes(event, supabase);
    }

    // Default to not-found handler
    return await notFoundRoutes(event);
  } catch (error) {
    console.error('Error in API handler:', error.message, error.stack);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal Server Error: ' + error.message })
    };
  }
};