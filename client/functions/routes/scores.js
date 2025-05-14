const { corsHeaders, checkUserRole } = require('./utils');

const scoresRoutes = async (event, supabase) => {
  const path = event.path
    .replace(/^\/\.netlify\/functions\/api\/?/, '/api/')
    .replace(/^\/api\/api\/?/, '/api/')
    .replace(/^\/+/, '/')
    .replace(/\/+$/, '');
  console.log('Normalized path in scoresRoutes:', path);
  console.log('HTTP method:', event.httpMethod);
  console.log('Headers in scoresRoutes:', event.headers);

  const token = event.headers['authorization']?.split(' ')[1];
  console.log('Authorization token:', token);

  // Route: GET /api/scores
  if (path === '/api/scores' && event.httpMethod === 'GET') {
    console.log('Handling /api/scores GET request');
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
    const userId = sessionData.user.id;
    console.log('Fetching scores for user:', userId);
    const { data, error } = await supabase
      .from('scores')
      .select('score_id, user_id, tournament_id, course_id, score_value, date_played, notes')
      .eq('user_id', userId);
    if (error) {
      console.error('Scores retrieval error:', error.message);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }
    console.log('Scores retrieved:', data);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ scores: data })
    };
  }

  // Route: GET /api/tournament-scores/:tournamentId
  if (path.startsWith('/api/tournament-scores/') && event.httpMethod === 'GET') {
    const tournamentId = path.split('/')[3];
    console.log('Handling /api/tournament-scores/:tournamentId GET request, tournamentId:', tournamentId);
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
    const userId = sessionData.user.id;
    console.log('Fetching tournament scores for user:', userId, 'tournamentId:', tournamentId);
    const { data, error } = await supabase
      .from('scores')
      .select('score_id, user_id, tournament_id, course_id, score_value, date_played, notes')
      .eq('tournament_id', tournamentId);
    if (error) {
      console.error('Tournament scores retrieval error:', error.message);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }
    console.log('Tournament scores retrieved:', data);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ scores: data })
    };
  }

  // Route: POST /api/scores
  if (path === '/api/scores' && event.httpMethod === 'POST') {
    console.log('Handling /api/scores POST request');
    const body = JSON.parse(event.body || '{}');
    const { userId, score, course, date_played, notes, tournament_id } = body;
    console.log('POST /api/scores body:', body);
    if (!userId || !score || !course || !date_played) {
      console.log('Missing required fields: userId, score, course, date_played');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'userId, score, course, and date_played are required' })
      };
    }
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
    // Ensure the logged-in user can only submit scores for themselves (unless admin)
    const userRole = await checkUserRole(token, supabase);
    if (userId !== sessionData.user.id && userRole !== 'admin') {
      console.log('User not authorized to submit score for another user');
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Forbidden: Cannot submit score for another user' })
      };
    }
    const { data, error } = await supabase
      .from('scores')
      .insert({
        user_id: userId,
        course_id: course,
        score_value: score,
        date_played,
        notes,
        tournament_id: tournament_id || null
      })
      .select()
      .single();
    if (error) {
      console.error('Score creation error:', error.message);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }
    console.log('Score created:', data);
    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({ score: data })
    };
  }

  // Route: PUT /api/scores/:scoreId
  if (path.startsWith('/api/scores/') && event.httpMethod === 'PUT') {
    const scoreId = path.split('/')[3];
    console.log('Handling /api/scores/:scoreId PUT request, scoreId:', scoreId);
    const body = JSON.parse(event.body || '{}');
    const { course, score_value, date_played, notes } = body;
    console.log('PUT /api/scores/:scoreId body:', body);
    if (!course || !score_value || !date_played) {
      console.log('Missing required fields: course, score_value, date_played');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'course, score_value, and date_played are required' })
      };
    }
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
    const userRole = await checkUserRole(token, supabase);
    const { data: scoreData, error: fetchError } = await supabase
      .from('scores')
      .select('user_id')
      .eq('score_id', scoreId)
      .single();
    if (fetchError || !scoreData) {
      console.error('Score not found:', fetchError?.message);
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Score not found' })
      };
    }
    if (scoreData.user_id !== sessionData.user.id && userRole !== 'admin') {
      console.log('User not authorized to update this score');
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Forbidden: Cannot update another user\'s score' })
      };
    }
    const { data, error } = await supabase
      .from('scores')
      .update({
        course_id: course,
        score_value,
        date_played,
        notes
      })
      .eq('score_id', scoreId)
      .select()
      .single();
    if (error) {
      console.error('Score update error:', error.message);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }
    console.log('Score updated:', data);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ data })
    };
  }

  // Route: DELETE /api/scores/:scoreId
  if (path.startsWith('/api/scores/') && event.httpMethod === 'DELETE') {
    const scoreId = path.split('/')[3];
    console.log('Handling /api/scores/:scoreId DELETE request, scoreId:', scoreId);
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
    const userRole = await checkUserRole(token, supabase);
    const { data: scoreData, error: fetchError } = await supabase
      .from('scores')
      .select('user_id')
      .eq('score_id', scoreId)
      .single();
    if (fetchError || !scoreData) {
      console.error('Score not found:', fetchError?.message);
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Score not found' })
      };
    }
    if (scoreData.user_id !== sessionData.user.id && userRole !== 'admin') {
      console.log('User not authorized to delete this score');
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Forbidden: Cannot delete another user\'s score' })
      };
    }
    const { error } = await supabase
      .from('scores')
      .delete()
      .eq('score_id', scoreId);
    if (error) {
      console.error('Score deletion error:', error.message);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }
    console.log('Score deleted:', scoreId);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Score deleted successfully' })
    };
  }

  console.log('No matching route found for:', path, event.httpMethod);
  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Not Found' })
  };
};

module.exports = scoresRoutes;