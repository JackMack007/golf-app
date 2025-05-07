const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// CORS headers to allow requests from the frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://golf-app-frontend.netlify.app',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

exports.handler = async function(event, context) {
  console.log('Initializing api');
  console.log('Raw event path:', event.path, 'Method:', event.httpMethod);
  console.log('Headers:', event.headers);

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
    console.log('Normalized path:', path);

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
      const { error: userError } = await supabase
        .from('users')
        .insert({
          user_id: userId,
          auth_user_id: userId,
          name: name || '',
          email: email,
          handicap: 0,
          created_at: new Date().toISOString()
        });
      if (userError) {
        console.error('User creation error:', userError.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Failed to create user: ' + userError.message })
        };
      }
      console.log('Signup successful:', data.user.id);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ user: data.user })
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
        .select('*')
        .eq('auth_user_id', userId)
        .single();
      if (userError || !userData) {
        // Create a default user record if it doesn't exist
        const { error: insertError } = await supabase
          .from('users')
          .insert({
            user_id: userId,
            auth_user_id: userId,
            name: '',
            email: email,
            handicap: 0,
            created_at: new Date().toISOString()
          });
        if (insertError) {
          console.error('User creation error on signin:', insertError.message);
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ error: 'Failed to create user: ' + insertError.message })
          };
        }
      }
      console.log('Signin successful:', data.user.id);
      console.log('Session data:', data.session);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ user: data.user, session: data.session })
      };
    }

    // Route: POST /api/scores
    if (path === '/api/scores' && event.httpMethod === 'POST') {
      console.log('Handling /api/scores request');
      const { userId, score, course, date_played, notes } = JSON.parse(event.body || '{}');
      if (!userId || !score || !course) {
        console.log('Missing userId, score, or course');
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'userId, score, and course are required' })
        };
      }
      const { data, error } = await supabase
        .from('scores')
        .insert([{ user_id: userId, score_value: score, course_id: course, date_played, notes }]);
      if (error) {
        console.error('Score submission error:', error.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message })
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
      if (!course || !score_value || !date_played) {
        console.log('Missing course, score_value, or date_played');
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'course, score_value, and date_played are required' })
        };
      }
      const { data, error } = await supabase
        .from('scores')
        .update({ course_id: course, score_value, date_played, notes })
        .eq('score_id', scoreId);
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
      console.log('Handling /api/courses/:id PUT request, courseId:', courseId);
      const { name, location, par, slope_value, course_value } = JSON.parse(event.body || '{}');
      if (!name || !location || !par || !slope_value || !course_value) {
        console.log('Missing required fields');
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'name, location, par, slope_value, and course_value are required' })
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
      console.log('Handling /api/courses/:id DELETE request, courseId:', courseId);
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
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', userId)
        .single();
      if (error) {
        console.error('User retrieval error:', error.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message })
        };
      }
      if (!data) {
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
        body: JSON.stringify({
          name: data.name || '',
          email: data.email,
          handicap: data.handicap || 0
        })
      };
    }

    // Route: PUT /api/profile
    if (path === '/api/profile' && event.httpMethod === 'PUT') {
      console.log('Handling /api/profile PUT request');
      const { name, email, handicap } = JSON.parse(event.body || '{}');
      if (!name || !email || handicap === undefined) {
        console.log('Missing required fields');
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'name, email, and handicap are required' })
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
      const userId = sessionData.user.id;
      const { data, error } = await supabase
        .from('users')
        .update({ name, email, handicap })
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