const { corsHeaders, checkUserRole } = require('../utils');

const scoresRoutes = async (event, supabase) => {
  const path = event.path
    .replace(/^\/\.netlify\/functions\/api\/?/, '/api/')
    .replace(/^\/api\/api\/?/, '/api/')
    .replace(/^\/+/, '/')
    .replace(/\/+$/, '');
  console.log('Normalized path in scoresRoutes:', path);

  const token = event.headers['authorization']?.split(' ')[1];
  console.log('Authorization token:', token);

  // Route: POST /api/scores
  if (path === '/api/scores' && event.httpMethod === 'POST') {
    console.log('Handling /api/scores request');
    const { userId, score, course, date_played, notes } = JSON.parse(event.body || '{}');
    console.log('POST /api/scores body:', { userId, score, course, date_played, notes });
    if (!userId || !score || !course || !date_played || !/^\d{4}-\d{2}-\d{2}$/.test(date_played)) {
      console.log('Missing or invalid userId, score, course, or date_played');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'userId, score, course, and a valid date_played (YYYY-MM-DD) are required' })
      };
    }
    const { data, error } = await supabase
      .from('scores')
      .insert([{ user_id: userId, score_value: score, course_id: course, date_played, notes }])
      .select();
    if (error) {
      console.error('Score submission error:', error.message);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }
    if (!data || data.length === 0) {
      console.error('Score insertion returned no data');
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Failed to retrieve inserted score' })
      };
    }
    console.log('Score submitted:', data);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ score: data[0] })
    };
  }

  // Route: GET /api/scores
  if (path === '/api/scores' && event.httpMethod === 'GET') {
    console.log('Handling /api/scores request');
    const { data, error } = await supabase
      .from('scores')
      .select('*');
    if (error) {
      console.error('Score retrieval error:', error.message);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }
    console.log('Scores retrieved:', data.length);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ scores: data })
    };
  }

  // Route: PUT /api/scores/:id
  if (path.startsWith('/api/scores/') && event.httpMethod === 'PUT') {
    const scoreId = path.split('/')[3];
    console.log('Handling /api/scores/:id PUT request, scoreId:', scoreId);
    const { course, score_value, date_played, notes } = JSON.parse(event.body || '{}');
    console.log('PUT /api/scores/:id body:', { course, score_value, date_played, notes });

    if (!course || !score_value || !date_played || !/^\d{4}-\d{2}-\d{2}$/.test(date_played)) {
      console.log('Missing or invalid course, score_value, or date_played');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'course, score_value, and a valid date_played (YYYY-MM-DD) are required' })
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

    let userRole;
    let userId;
    try {
      userRole = await checkUserRole(token, supabase);
      console.log('User role retrieved:', userRole);
      const { data: sessionData, error: sessionError } = await supabase.auth.getUser(token);
      if (sessionError || !sessionData?.user) {
        console.error('Session error:', sessionError?.message);
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Unauthorized: Invalid session token' })
        };
      }
      userId = sessionData.user.id;
      console.log('Authenticated userId:', userId);
    } catch (error) {
      console.error('Role check error:', error.message);
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Unauthorized: ' + error.message })
      };
    }

    let scoreData;
    if (userRole !== 'admin') {
      console.log('Checking score ownership for user:', userId);
      const { data, error: scoreError } = await supabase
        .from('scores')
        .select('user_id')
        .eq('score_id', scoreId)
        .single();
      if (scoreError || !data) {
        console.error('Score not found during ownership check:', scoreError?.message);
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Score not found' })
        };
      }
      console.log('Score ownership check - Score user_id:', data.user_id);
      if (data.user_id !== userId) {
        console.log('User not authorized to edit this score:', { userId, scoreUserId: data.user_id });
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden: You can only edit your own scores' })
        };
      }
      scoreData = data;
    } else {
      const { data, error: scoreError } = await supabase
        .from('scores')
        .select('user_id')
        .eq('score_id', scoreId)
        .single();
      if (scoreError || !data) {
        console.error('Score not found for admin:', scoreError?.message);
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Score not found' })
        };
      }
      scoreData = data;
    }

    console.log('Updating score for user:', userId, 'with role:', userRole);
    const { data, error } = await supabase
      .from('scores')
      .update({ course_id: course, score_value, date_played, notes })
      .eq('score_id', scoreId)
      .select();
    console.log('Update query result:', { data, error });

    if (error) {
      console.error('Score update error:', error.message);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }
    if (!data || data.length === 0) {
      console.error('Score update returned no data');
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Score not found' })
      };
    }
    console.log('Score updated:', data);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ data: data[0] })
    };
  }

  // Route: DELETE /api/scores/:id
  if (path.startsWith('/api/scores/') && event.httpMethod === 'DELETE') {
    const scoreId = path.split('/')[3];
    console.log('Handling /api/scores/:id DELETE request, scoreId:', scoreId);
    const { error } = await supabase
      .from('scores')
      .delete()
      .eq('score_id', scoreId);
    if (error) {
      console.error('Score deletion error:', error.message);
      return {
        statusCode: 400,
        headers: corsHeaders,
        bodyComputations: JSON.stringify({ error: error.message })
      };
    }
    console.log('Score deleted:', scoreId);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'Score deleted successfully' })
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

module.exports = scoresRoutes;