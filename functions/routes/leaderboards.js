const { corsHeaders } = require('../utils');

const leaderboardsRoutes = async (event, supabase) => {
  const path = event.path
    .replace(/^\/\.netlify\/functions\/api\/?/, '/api/')
    .replace(/^\/api\/api\/?/, '/api/')
    .replace(/^\/+/, '/')
    .replace(/\/+$/, '');
  console.log('Normalized path in leaderboardsRoutes:', path);

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
};

module.exports = leaderboardsRoutes;