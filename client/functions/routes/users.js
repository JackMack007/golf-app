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
  console.log('Authorization token in usersRoutes:', token);

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
    console.error('Session validation in usersRoutes failed:', sessionError?.message);
    return {
      statusCode: 401,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Unauthorized: Invalid session token' })
    };
  }

  const userId = sessionData.user.id;
  console.log('Fetched userId from token in usersRoutes:', userId);

  let userRole = 'user';
  try {
    userRole = await checkUserRole(token, supabase);
    console.log('User role retrieved:', userRole);
  } catch (error) {
    console.error('Role check error, defaulting to user role:', error.message);
    userRole = 'user';
  }

  // Route: GET /api/users (Admin Only)
  if (path === '/api/users' && event.httpMethod === 'GET') {
    console.log('Handling /api/users request');
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
    const userIdParam = path.split('/')[3];
    console.log('Handling /api/users/:id GET request, userId:', userIdParam);
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
      .eq('user_id', userIdParam)
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
    const userIdParam = path.split('/')[3];
    console.log('Handling /api/users/:id PUT request, userId:', userIdParam);
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
      .eq('user_id', userIdParam)
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
      .eq('user_id', userIdParam)
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
    const userIdParam = path.split('/')[3];
    console.log('Handling /api/users/:id DELETE request, userId:', userIdParam);
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
      .eq('user_id', userIdParam)
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
      .eq('user_id', userIdParam);
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
      .eq('user_id', userIdParam);
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
    console.log('User deleted:', userIdParam);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: 'User deleted successfully' })
    };
  }

  // Route: GET /api/profile
  if (path === '/api/profile' && event.httpMethod === 'GET') {
    console.log('Handling /api/profile GET request');
    const { data, error } = await supabase
      .from('users')
      .select('auth_user_id, name, email, handicap, user_role')
      .eq('auth_user_id', userId);
    if (error) {
      console.error('User retrieval error in GET /api/profile:', error.message);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }
    if (!data || data.length === 0) {
      console.error('No user found for auth_user_id in GET /api/profile:', userId);
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'User not found' })
      };
    }
    if (data.length > 1) {
      console.error('Multiple users found for auth_user_id in GET /api/profile:', userId);
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Multiple users found for this auth_user_id' })
      };
    }
    const userData = data[0];
    console.log('User retrieved in GET /api/profile:', userData);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        user_id: userData.auth_user_id,
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
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('auth_user_id, name, email, handicap, user_role')
      .eq('auth_user_id', userId)
      .single();
    if (fetchError || !currentUser) {
      console.error('User fetch error in PUT /api/profile:', fetchError?.message);
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
      console.error('User update error in PUT /api/profile:', error.message);
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: error.message })
      };
    }
    console.log('User profile updated in PUT /api/profile:', data);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        user_id: data.auth_user_id,
        name: data.name || '',
        email: data.email,
        handicap: data.handicap || 0,
        role: data.user_role || 'user'
      })
    };
  }

  console.log('No matching route found for:', path, event.httpMethod);
  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Not Found' })
  };
};

module.exports = usersRoutes;