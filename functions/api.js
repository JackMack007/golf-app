const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

exports.handler = async function(event, context) {
  console.log('Initializing api');
  console.log('Raw event path:', event.path, 'Method:', event.httpMethod);
  try {
    // Normalize path by removing Netlify function prefix and ensuring single leading slash
    let path = event.path
      .replace(/^\/\.netlify\/functions\/api\/?/, '/api/')
      .replace(/^\/api\/api\/?/, '/api/') // Handle double /api/api/ from URL
      .replace(/^\/+/, '/'); // Ensure single leading slash
    console.log('Normalized path:', path);

    // Route: GET /api/health
    if (path === '/api/health' && event.httpMethod === 'GET') {
      console.log('Handling /api/health request');
      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'Server is running' }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
    }

    // Route: POST /api/auth/signup
    if (path === '/api/auth/signup' && event.httpMethod === 'POST') {
      console.log('Handling /api/auth/signup request');
      const { email, password } = JSON.parse(event.body || '{}');
      if (!email || !password) {
        console.log('Missing email or password');
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Email and password are required' }),
          headers: {
            'Content-Type': 'application/json'
          }
        };
      }
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        console.error('Signup error:', error.message);
        return {
          statusCode: 400,
          body: JSON.stringify({ error: error.message }),
          headers: {
            'Content-Type': 'application/json'
          }
        };
      }
      console.log('Signup successful:', data.user.id);
      return {
        statusCode: 200,
        body: JSON.stringify({ user: data.user }),
        headers: {
          'Content-Type': 'application/json'
        }
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
          body: JSON.stringify({ error: 'Email and password are required' }),
          headers: {
            'Content-Type': 'application/json'
          }
        };
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Signin error:', error.message);
        return {
          statusCode: 400,
          body: JSON.stringify({ error: error.message }),
          headers: {
            'Content-Type': 'application/json'
          }
        };
      }
      console.log('Signin successful:', data.user.id);
      return {
        statusCode: 200,
        body: JSON.stringify({ user: data.user, session: data.session }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
    }

    // Route: POST /api/scores
    if (path === '/api/scores' && event.httpMethod === 'POST') {
      console.log('Handling /api/scores request');
      const { userId, score, course } = JSON.parse(event.body || '{}');
      if (!userId || !score || !course) {
        console.log('Missing userId, score, or course');
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'userId, score, and course are required' }),
          headers: {
            'Content-Type': 'application/json'
          }
        };
      }
      const { data, error } = await supabase
        .from('scores')
        .insert([{ user_id: userId, score, course }]);
      if (error) {
        console.error('Score submission error:', error.message);
        return {
          statusCode: 400,
          body: JSON.stringify({ error: error.message }),
          headers: {
            'Content-Type': 'application/json'
          }
        };
      }
      console.log('Score submitted:', data);
      return {
        statusCode: 200,
        body: JSON.stringify({ score: data[0] }),
        headers: {
          'Content-Type': 'application/json'
        }
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
          body: JSON.stringify({ error: error.message }),
          headers: {
            'Content-Type': 'application/json'
          }
        };
      }
      console.log('Scores retrieved:', data.length);
      return {
        statusCode: 200,
        body: JSON.stringify({ scores: data }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
    }

    console.log('No matching route:', path, event.httpMethod);
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not found' }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    console.error('Error in api:', error.message, error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};