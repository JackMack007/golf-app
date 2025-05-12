const { corsHeaders, checkUserRole } = require('./utils');

const usersRoutes = async (event, supabase) => {
  const path = event.path
    .replace(/^\/\.netlify\/functions\/api\/?/, '/api/')
    .replace(/^\/api\/api\/?/, '/api/')
    .replace(/^\/+/, '/')
    .replace(/\/+$/, '');
  console.log('Normalized path in usersRoutes:', path);
  console.log('HTTP method:', event.httpMethod);
  console.log('Headers in usersRoutes:', event.headers);

  const token = event.headers['authorization']?.split(' ')[1];
  console.log('Authorization token:', token);

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
    console.log('Fetching all users from Supabase');
    const { data, error } = await supabase
      .from('users')
      .select('user_id, email, name, handicap');
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
      .from('users')
      .select('user_id, email, name, handicap')
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

  // Route: PUT /api/users/:id (Admin Only)
  if (path.startsWith('/api/users/') && event.httpMethod === 'PUT') {
    const userId = path.split('/')[3];
    console.log('Handling /api/users/:id PUT request, userId:', userId);
    const { name, email, handicap } = JSON.parse(event.body || '{}');
    console.log('PUT /api/users/:id body:', { name, email, handicap });
    if (!name || !email || handicap === undefined) {
      console.log('Missing required fields: name, email, or handicap');
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'name, email, and handicap are required' })
      };
    }
    const parsedHandicap = parseFloat(handicap);
    if (isNaN(parsedHandicap) || parsedHandicap < 0) {
      console.log('Invalid handicap value:', handicap);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'handicap must be a non-negative number' })
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
    try {
      userRole = await checkUserRole(token, supabase);
      console.log('User role retrieved:', userRole);
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
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('user_id')
      .eq('user_id', userId)
      .single();
    if (fetchError || !existingUser) {
      console.error('User not found:', fetchError?.message);
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'User not found' })
      };
    }
    const { data, error } = await supabase
      .from('users')
      .update({ name, email, handicap: parsedHandicap })
      .eq('user_id', userId)
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

  // Route: DELETE /api/users/:id (Admin Only)
  if (path.startsWith('/api/users/') && event.httpMethod === 'DELETE') {
    const userId = path.split('/')[3];
    console.log('Handling /api/users/:id DELETE request, userId:', userId);
    if (!token) {
      console.error('No authorization token provided');
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Unauthorized: No token provided' })
      };
    }
    let userRole;
    try {
      userRole = await checkUserRole(token, supabase);
      console.log('User role retrieved:', userRole);
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
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_id, auth_user_id')
      .eq('user_id', userId)
      .single();
    if (userError || !userData) {
      console.error('User not found:', userError?.message);
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'User not found' })
      };
    }
    const { data: associatedScores, error: scoreError } = await supabase
      .from('scores')
      .select('score_id')
      .eq('user_id', userId);
    if (scoreError) {
      console.error('Error checking associated scores:', scoreError.message);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: scoreError.message })
      };
    }
    if (associatedScores && associatedScores.length > 0) {
      console.log('Cannot delete user with associated scores:', associatedScores.length);
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Forbidden: Cannot delete user with associated scores' })
      };
    }
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('user_id', userId);
    if (deleteError) {
      console.error('User deletion error:', deleteError.message);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: deleteError.message })
      };
    }
    const { error: authError } = await supabase.auth.admin.deleteUser(userData.auth_user_id);
    if (authError) {
      console.error('Auth user deletion error:', authError.message);
      console.warn('Proceeding despite auth deletion error; user already removed from users table');
    }
    console.log('User deleted:', userId);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'User deleted successfully' })
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
    const updatedData = {
      name: name !== undefined && name !== '' ? name : currentUser.name,
      email: email !== undefined && email !== '' ? email : currentUser.email,
      handicap: handicap !== undefined ? parseFloat(handicap) : currentUser.handicap
    };
    const { data, error } = await supabase
      .from('users')
      .update(updatedData)
      .eq('auth_user_id', userId)
      .select()
      .single();
    if (error) {
      console.error('User update error:', error.message);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }
    console.log('User profile updated:', data);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        name: data.name || '',
        email: data.email,
        handicap: data.handicap || 0,
        role: data.user_role || 'user'
      })
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

module.exports = usersRoutes;