const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

// CORS headers to allow requests from the frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://golf-app-frontend.netlify.app',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

// Helper function to check the user's role
const checkUserRole = async (token, supabase) => {
  if (!token) {
    throw new Error('No authorization token provided');
  }
  console.log('checkUserRole - Validating token:', token);
  const { data: sessionData, error: sessionError } = await supabase.auth.getUser(token);
  if (sessionError || !sessionData?.user) {
    console.error('checkUserRole - Session error:', sessionError?.message);
    throw new Error('Invalid session token');
  }
  const userId = sessionData.user.id;
  console.log('checkUserRole - Retrieved userId from token:', userId);

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('user_role')
    .eq('auth_user_id', userId)
    .single();
  console.log('checkUserRole - Query result:', { userData, userError });

  if (userError || !userData) {
    console.error('checkUserRole - User fetch error:', userError?.message);
    throw new Error('User not found: ' + (userError?.message || 'No data returned'));
  }
  console.log('checkUserRole - User role:', userData.user_role);
  return userData.user_role;
};

exports.handler = async function(event, context) {
  console.log('Initializing api');
  console.log('Raw event path:', event.path, 'Method:', event.httpMethod);
  console.log('Headers:', event.headers);

  // Initialize a fresh Supabase client for each request
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  // Handle OPTIONS preflight request
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // Normalize path by removing Netlify function prefix and ensuring single leading slash
    let path = event.path
      .replace(/^\/\.netlify\/functions\/api\/?/, '/api/')
      .replace(/^\/api\/api\/?/, '/api/')
      .replace(/^\/+/, '/');
    console.log('Normalized path after first replacement:', path);

    // Additional normalization for trailing slashes
    path = path.replace(/\/+$/, '');
    console.log('Normalized path after trailing slash removal:', path);

    // Ensure path starts with /api
    if (!path.startsWith('/api')) {
      path = '/api' + (path.startsWith('/') ? path : '/' + path);
    }
    console.log('Final normalized path:', path);

    // Extract token for authentication
    const token = event.headers['authorization']?.split(' ')[1];
    console.log('Authorization token:', token);

    // Route: GET /api/health
    if (path === '/api/health' && event.httpMethod === 'GET') {
      console.log('Handling /api/health request');
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ status: 'Server is running' })
      };
    }

    // Route: POST /api/auth/signup
    if (path === '/api/auth/signup' && event.httpMethod === 'POST') {
      console.log('Handling /api/auth/signup request');
      const { email, password, name } = JSON.parse(event.body || '{}');
      if (!email || !password) {
        console.log('Missing email or password');
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Email and password are required' })
        };
      }
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        console.error('Signup error:', error.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message })
        };
      }
      // Create a record in the users table
      const userId = data.user.id;
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          user_id: userId,
          auth_user_id: userId,
          name: name || '',
          email: email,
          handicap: 0,
          created_at: new Date().toISOString(),
          user_role: 'user' // Explicitly set user_role as 'user' for new signups
        })
        .select()
        .single();
      if (userError) {
        console.error('User creation error:', userError.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Failed to create user: ' + userError.message })
        };
      }
      console.log('Signup successful:', data.user.id);
      // Construct the user object explicitly to avoid Supabase Auth role conflict
      const userResponse = {
        id: data.user.id,
        email: data.user.email,
        role: userData.user_role
      };
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ user: userResponse })
      };
    }

    // Route: POST /api/auth/signin
    if (path === '/api/auth/signin' && event.httpMethod === 'POST') {
      console.log('Handling /api/auth/signin request');
      const { email, password } = JSON.parse(event.body || '{}');
      if (!email || !password) {
        console.log('Missing email or password');
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Email and password are required' })
        };
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Signin error:', error.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message })
        };
      }
      // Ensure a record exists in the users table
      const userId = data.user.id;
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id, auth_user_id, name, email, handicap, created_at, user_role')
        .eq('auth_user_id', userId)
        .single();
      if (userError || !userData) {
        // Create a default user record if it doesn't exist
        const { data: newUserData, error: insertError } = await supabase
          .from('users')
          .insert({
            user_id: userId,
            auth_user_id: userId,
            name: '',
            email: email,
            handicap: 0,
            created_at: new Date().toISOString(),
            user_role: 'user' // Explicitly set user_role as 'user' for new users
          })
          .select()
          .single();
        if (insertError) {
          console.error('User creation error on signin:', insertError.message);
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Failed to create user: ' + insertError.message })
          };
        }
        console.log('Signin successful:', data.user.id);
        console.log('Session data:', data.session);
        // Construct the user object explicitly to avoid Supabase Auth role conflict
        const userResponse = {
          id: data.user.id,
          email: data.user.email,
          role: newUserData.user_role
        };
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ user: userResponse, session: data.session })
        };
      }
      console.log('Signin successful:', data.user.id);
      console.log('Session data:', data.session);
      // Construct the user object explicitly to avoid Supabase Auth role conflict
      const userResponse = {
        id: data.user.id,
        email: data.user.email,
        role: userData.user_role
      };
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ user: userResponse, session: data.session })
      };
    }

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

      // Validate request body
      if (!course || !score_value || !date_played || !/^\d{4}-\d{2}-\d{2}$/.test(date_played)) {
        console.log('Missing or invalid course, score_value, or date_played');
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'course, score_value, and a valid date_played (YYYY-MM-DD) are required' })
        };
      }

      // Check for authentication token
      if (!token) {
        console.error('No authorization token provided');
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Unauthorized: No token provided' })
        };
      }

      // Get the authenticated user's role and ID
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

      // If the user is not an admin, check if they own the score
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
        // For admins, fetch the score to confirm it exists
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

      // Proceed with the update
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

    // Route: GET /api/users (Admin Only)
    if (path === '/api/users' && event.httpMethod === 'GET') {
      console.log('Handling /api/users request');
      if (!token) {
        console.error('No authorization token provided');
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Unauthorized: No token provided' })
        };
      }

      // Check user role
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
        console.log('Authenticated userId for GET /api/users:', userId);
      } catch (error) {
        console.error('Role check error:', error.message);
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Unauthorized: ' + error.message })
        };
      }

      if (userRole !== 'admin') {
        console.log('User role not authorized:', userRole);
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden: Admin access required' })
        };
      }

      // Fetch all users
      console.log('Fetching all users from Supabase');
      const { data, error } = await supabase
        .from('users')
        .select('user_id, email, name');
      if (error) {
        console.error('Users retrieval error:', error.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message })
        };
      }
      console.log('Raw data from Supabase query:', data);
      console.log('Number of users retrieved:', data.length);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(data)
      };
    }

    // Route: GET /api/users/:id (Admin Only)
    if (path.startsWith('/api/users/') && event.httpMethod === 'GET') {
      const userId = path.split('/')[3];
      console.log('Handling /api/users/:id GET request, userId:', userId);
      if (!token) {
        console.error('No authorization token provided');
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Unauthorized: No token provided' })
        };
      }

      // Check user role
      let userRole;
      try {
        userRole = await checkUserRole(token, supabase);
      } catch (error) {
        console.error('Role check error:', error.message);
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Unauthorized: ' + error.message })
        };
      }

      if (userRole !== 'admin') {
        console.log('User role not authorized:', userRole);
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden: Admin access required' })
        };
      }

      // Fetch user details
      const { data, error } = await supabase
        .from('users')
        .select('user_id, email, name')
        .eq('user_id', userId)
        .single();
      if (error || !data) {
        console.error('User retrieval error:', error?.message);
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'User not found' })
        };
      }
      console.log('User retrieved:', data);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(data)
      };
    }

    // Route: GET /api/courses
    if (path === '/api/courses' && event.httpMethod === 'GET') {
      console.log('Handling /api/courses request');
      const { data, error } = await supabase
        .from('courses')
        .select('*');
      if (error) {
        console.error('Course retrieval error:', error.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message })
        };
      }
      console.log('Courses retrieved:', data.length);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(data)
      };
    }

    // Route: POST /api/courses
    if (path === '/api/courses' && event.httpMethod === 'POST') {
      console.log('Handling /api/courses request');
      const { name, location, par, slope_value, course_value } = JSON.parse(event.body || '{}');
      if (!name || !location || !par || !slope_value || !course_value) {
        console.log('Missing required fields');
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'name, location, par, slope_value, and course_value are required' })
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
      // Check user role
      let userRole;
      try {
        userRole = await checkUserRole(token, supabase);
      } catch (error) {
        console.error('Role check error:', error.message);
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Unauthorized: ' + error.message })
        };
      }
      if (userRole !== 'admin') {
        console.log('User role not authorized:', userRole);
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden: Admin access required' })
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
      const { data, error } = await supabase
        .from('courses')
        .insert([{ name, location, par, slope_value, course_value, created_by: userId }])
        .select();
      if (error) {
        console.error('Course creation error:', error.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message })
        };
      }
      if (!data || data.length === 0) {
        console.error('Course creation returned no data');
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Failed to retrieve created course' })
        };
      }
      console.log('Course created:', data);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(data[0])
      };
    }

    // Route: PUT /api/courses/:id
    if (path.startsWith('/api/courses/') && event.httpMethod === 'PUT') {
      const courseId = path.split('/')[3];
      console.log('Handling /api/courses/:id PUT request, scoreId:', courseId);
      const { name, location, par, slope_value, course_value } = JSON.parse(event.body || '{}');
      if (!name || !location || !par || !slope_value || !course_value) {
        console.log('Missing required fields');
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'name, location, par, slope_value, and course_value are required' })
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
      // Check user role
      let userRole;
      try {
        userRole = await checkUserRole(token, supabase);
      } catch (error) {
        console.error('Role check error:', error.message);
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Unauthorized: ' + error.message })
        };
      }
      if (userRole !== 'admin') {
        console.log('User role not authorized:', userRole);
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden: Admin access required' })
        };
      }
      const { data, error } = await supabase
        .from('courses')
        .update({ name, location, par, slope_value, course_value })
        .eq('course_id', courseId)
        .select();
      if (error) {
        console.error('Course update error:', error.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message })
        };
      }
      if (!data || data.length === 0) {
        console.error('Course update returned no data');
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Course not found' })
        };
      }
      console.log('Course updated:', data);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ data: data[0] })
      };
    }

    // Route: DELETE /api/courses/:id
    if (path.startsWith('/api/courses/') && event.httpMethod === 'DELETE') {
      const courseId = path.split('/')[3];
      console.log('Handling /api/courses/:id DELETE request, scoreId:', courseId);

      if (!token) {
        console.error('No authorization token provided');
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Unauthorized: No token provided' })
        };
      }

      // Check user role
      let userRole;
      try {
        userRole = await checkUserRole(token, supabase);
      } catch (error) {
        console.error('Role check error:', error.message);
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Unauthorized: ' + error.message })
        };
      }

      if (userRole !== 'admin') {
        console.log('User role not authorized for deletion:', userRole);
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden: Only admins can delete courses' })
        };
      }

      // Check for associated scores
      const { data: associatedScores, error: scoreError } = await supabase
        .from('scores')
        .select('score_id')
        .eq('course_id', courseId);
      if (scoreError) {
        console.error('Error checking associated scores:', scoreError.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: scoreError.message })
        };
      }
      if (associatedScores && associatedScores.length > 0) {
        console.log('Cannot delete course with associated scores:', associatedScores.length);
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden: Cannot delete course with associated scores' })
        };
      }

      // Proceed with deletion for admin
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('course_id', courseId);
      if (error) {
        console.error('Course deletion error:', error.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message })
        };
      }
      console.log('Course deleted:', courseId);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Course deleted successfully' })
      };
    }

    // Route: POST /api/tournaments (Admin Only)
    if (path === '/api/tournaments' && event.httpMethod === 'POST') {
      console.log('Handling /api/tournaments POST request');
      const { name, start_date, end_date } = JSON.parse(event.body || '{}');
      if (!name || !start_date || !end_date || !/^\d{4}-\d{2}-\d{2}$/.test(start_date) || !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
        console.log('Missing or invalid name, start_date, or end_date');
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'name, start_date, and end_date (YYYY-MM-DD) are required' })
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
      // Check user role
      let userRole;
      try {
        userRole = await checkUserRole(token, supabase);
      } catch (error) {
        console.error('Role check error:', error.message);
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Unauthorized: ' + error.message })
        };
      }
      if (userRole !== 'admin') {
        console.log('User role not authorized:', userRole);
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden: Admin access required' })
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
      const { data, error } = await supabase
        .from('tournaments')
        .insert([{ name, start_date, end_date, created_by: userId }])
        .select();
      if (error) {
        console.error('Tournament creation error:', error.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message })
        };
      }
      if (!data || data.length === 0) {
        console.error('Tournament creation returned no data');
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Failed to retrieve created tournament' })
        };
      }
      console.log('Tournament created:', data);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(data[0])
      };
    }

    // Route: GET /api/tournaments
    if (path === '/api/tournaments' && event.httpMethod === 'GET') {
      console.log('Handling /api/tournaments request');
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
      const { data, error } = await supabase
        .from('tournaments')
        .select('*');
      if (error) {
        console.error('Tournament retrieval error:', error.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message })
        };
      }
      console.log('Tournaments retrieved:', data.length);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ tournaments: data })
      };
    }

    // Route: POST /api/tournament-participants (Admin Only)
    if (path === '/api/tournament-participants' && event.httpMethod === 'POST') {
      console.log('Handling /api/tournament-participants POST request');
      const { tournament_id, user_id } = JSON.parse(event.body || '{}');
      console.log('Request body:', { tournament_id, user_id });
      if (!tournament_id || !user_id) {
        console.log('Missing tournament_id or user_id');
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'tournament_id and user_id are required' })
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
      // Check user role
      let userRole;
      try {
        userRole = await checkUserRole(token, supabase);
      } catch (error) {
        console.error('Role check error:', error.message);
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Unauthorized: ' + error.message })
        };
      }
      if (userRole !== 'admin') {
        console.log('User role not authorized:', userRole);
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden: Admin access required' })
        };
      }
      // Verify that the tournament exists
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('tournament_id')
        .eq('tournament_id', tournament_id);
      console.log('Tournament query result:', { data: tournamentData, error: tournamentError });
      if (tournamentError || !tournamentData || tournamentData.length === 0) {
        console.error('Tournament not found:', tournamentError?.message);
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Tournament not found' })
        };
      }
      // Verify that the user exists
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id')
        .eq('user_id', user_id);
      console.log('User query result:', { data: userData, error: userError });
      if (userError || !userData || userData.length === 0) {
        console.error('User not found:', userError?.message);
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'User not found' })
        };
      }
      // Add the participant to the tournament
      const { data, error } = await supabase
        .from('tournament_participants')
        .insert([{ tournament_id, user_id }])
        .select();
      if (error) {
        console.error('Participant addition error:', error.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message })
        };
      }
      if (!data || data.length === 0) {
        console.error('Participant addition returned no data');
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Failed to retrieve added participant' })
        };
      }
      console.log('Participant added:', data);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(data[0])
      };
    }

    // Route: POST /api/tournament-courses (Admin Only)
    if (path === '/api/tournament-courses' && event.httpMethod === 'POST') {
      console.log('Handling /api/tournament-courses POST request');
      const { tournament_id, course_id, play_date } = JSON.parse(event.body || '{}');
      if (!tournament_id || !course_id || !play_date || !/^\d{4}-\d{2}-\d{2}$/.test(play_date)) {
        console.log('Missing or invalid tournament_id, course_id, or play_date');
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'tournament_id, course_id, and play_date (YYYY-MM-DD) are required' })
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
      // Check user role
      let userRole;
      try {
        userRole = await checkUserRole(token, supabase);
      } catch (error) {
        console.error('Role check error:', error.message);
        return {
          statusCode: 401,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Unauthorized: ' + error.message })
        };
      }
      if (userRole !== 'admin') {
        console.log('User role not authorized:', userRole);
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden: Admin access required' })
        };
      }
      // Verify that the tournament exists
      const { data: tournamentData, error: tournamentError } = await supabase
        .from('tournaments')
        .select('tournament_id')
        .eq('tournament_id', tournament_id)
        .single();
      if (tournamentError || !tournamentData) {
        console.error('Tournament not found:', tournamentError?.message);
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Tournament not found' })
        };
      }
      // Verify that the course exists
      const { data: courseData, error: courseError } = await supabase
        .from('courses')
        .select('course_id')
        .eq('course_id', course_id)
        .single();
      if (courseError || !courseData) {
        console.error('Course not found:', courseError?.message);
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Course not found' })
        };
      }
      // Add the course to the tournament
      const { data, error } = await supabase
        .from('tournament_courses')
        .insert([{ tournament_id, course_id, play_date }])
        .select();
      if (error) {
        console.error('Tournament course addition error:', error.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message })
        };
      }
      if (!data || data.length === 0) {
        console.error('Tournament course addition returned no data');
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Failed to retrieve added tournament course' })
        };
      }
      console.log('Tournament course added:', data);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(data[0])
      };
    }

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

    // Route: GET /api/profile
    if (path === '/api/profile' && event.httpMethod === 'GET') {
      console.log('Handling /api/profile GET request');
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
      console.log('Fetching profile for userId:', userId);

      // Fetch user profile without .single() to handle multiple/no rows
      const { data, error } = await supabase
        .from('users')
        .select('name, email, handicap, user_role')
        .eq('auth_user_id', userId);

      if (error) {
        console.error('User retrieval error:', error.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message })
        };
      }

      if (!data || data.length === 0) {
        console.error('No user found for auth_user_id:', userId);
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'User not found' })
        };
      }

      if (data.length > 1) {
        console.error('Multiple users found for auth_user_id:', userId);
        return {
          statusCode: 500,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Multiple users found for this auth_user_id' })
        };
      }

      const userData = data[0];
      console.log('User retrieved:', userData);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          name: userData.name || '',
          email: userData.email,
          handicap: userData.handicap || 0,
          role: userData.user_role || 'user'
        })
      };
    }

    // Route: PUT /api/profile
    if (path === '/api/profile' && event.httpMethod === 'PUT') {
      console.log('Handling /api/profile PUT request');
      const { name, email, handicap } = JSON.parse(event.body || '{}');
      console.log('PUT /api/profile body:', { name, email, handicap });
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

      // Fetch the current user data to fill in missing fields
      const { data: currentUser, error: fetchError } = await supabase
        .from('users')
        .select('name, email, handicap, user_role')
        .eq('auth_user_id', userId)
        .single();
      if (fetchError || !currentUser) {
        console.error('User fetch error:', fetchError?.message);
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'User not found' })
        };
      }

      // Use current values for any missing fields
      const updatedData = {
        name: name !== undefined && name !== '' ? name : currentUser.name,
        email: email !== undefined && email !== '' ? email : currentUser.email,
        handicap: handicap !== undefined ? parseFloat(handicap) : currentUser.handicap
      };

      const { data, error } = await supabase
        .from('users')
        .update(updatedData)
        .eq('auth_user_id', userId)
        .select();
      if (error) {
        console.error('User update error:', error.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message })
        };
      }
      if (!data || data.length === 0) {
        console.error('User update returned no data');
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'User not found' })
        };
      }
      console.log('User updated:', data);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(data[0])
      };
    }

    console.log('No matching route:', path, event.httpMethod);
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Not found' })
    };
  } catch (error) {
    console.error('Error in api:', error.message, error.stack);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};