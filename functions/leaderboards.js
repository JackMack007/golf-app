const { corsHeaders, initializeSupabase } = require('./utils');

exports.handler = async function(event, context) {
  console.log('Handling leaderboards request:', event.path, event.httpMethod);

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
    console.log('Handling OPTIONS preflight request for leaderboards');
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const path = event.path
      .replace(/^\/\.netlify\/functions\/leaderboards\/?/, '/api/')
      .replace(/^\/api\/api\/?/, '/api/')
      .replace(/^\/+/, '/')
      .replace(/\/+$/, '');
    console.log('Normalized path:', path);

    const token = event.headers['authorization']?.split(' ')[1];
    console.log('Authorization token:', token);

    // Route: GET /api/leaderboards
    if (path === '/api/leaderboards' && event.httpMethod === 'GET') {
      console.log('Handling /api/leaderboards request');
      if (!token) {
        console.error('No authorization token provided');
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Unauthorized: No token provided' })
        };
      }
      const { data: sessionData, error: sessionError } = await supabase.auth.getUser(token);
      if (sessionError || !sessionData?.user) {
        console.error('Session error:', sessionError?.message);
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Unauthorized: Invalid session token' })
        };
      }
      // Placeholder response for leaderboards (to be implemented later)
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ leaderboards: [], message: 'Leaderboards feature coming soon' })
      };
    }

    // If no route matches
    console.log('No matching route found for:', path, event.httpMethod);
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Not Found' })
    };
  } catch (error) {
    console.error('Error in leaderboards handler:', error.message, error.stack);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal Server Error: ' + error.message })
    };
  }
};