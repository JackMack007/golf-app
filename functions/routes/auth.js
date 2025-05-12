const { corsHeaders } = require('../utils');

const authRoutes = async (event, supabase) => {
  const path = event.path
    .replace(/^\/\.netlify\/functions\/api\/?/, '/api/')
    .replace(/^\/api\/api\/?/, '/api/')
    .replace(/^\/+/, '/')
    .replace(/\/+$/, '');

  // Route: POST /api/auth
  if (path === '/api/auth' && event.httpMethod === 'POST') {
    const { email, password, name, action } = JSON.parse(event.body || '{}');
    if (!action) {
      console.log('Missing action in request body');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Action is required (signin or signup)' })
      };
    }

    if (action === 'signin') {
      console.log('Handling /api/auth signin request');
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
      const userId = data.user.id;
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('user_id, auth_user_id, name, email, handicap, created_at, user_role')
        .eq('auth_user_id', userId)
        .single();
      if (userError || !userData) {
        const { data: newUserData, error: insertError } = await supabase
          .from('users')
          .insert({
            user_id: userId,
            auth_user_id: userId,
            name: '',
            email: email,
            handicap: 0,
            created_at: new Date().toISOString(),
            user_role: 'user'
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

    if (action === 'signup') {
      console.log('Handling /api/auth signup request');
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
          user_role: 'user'
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

    console.log('Invalid action:', action);
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Invalid action: must be signin or signup' })
    };
  }

  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Not Found' })
  };
};

module.exports = authRoutes;