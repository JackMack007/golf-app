const { corsHeaders, checkUserRole } = require('../utils');

const coursesRoutes = async (event, supabase) => {
  const path = event.path
    .replace(/^\/\.netlify\/functions\/api\/?/, '/api/')
    .replace(/^\/api\/api\/?/, '/api/')
    .replace(/^\/+/, '/')
    .replace(/\/+$/, '');
  console.log('Normalized path in coursesRoutes:', path);

  const token = event.headers['authorization']?.split(' ')[1];
  console.log('Authorization token:', token);

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
      console.log('User role not authorized for deletion:', userRole);
      return {
        statusCode: 403,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Forbidden: Only admins can delete courses' })
      };
    }

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

  // If no route matches
  console.log('No matching route found for:', path, event.httpMethod);
  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Not Found' })
  };
};

module.exports = coursesRoutes;