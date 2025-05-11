const { corsHeaders, checkUserRole, initializeSupabase } = require('./utils');

exports.handler = async function(event, context) {
  console.log('Handling tournaments request:', event.path, event.httpMethod);

  // Initialize Supabase client
  let supabase;
  try {
    supabase = initializeSupabase();
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Server error: Failed to initialize database client' })
    };
  }

  // Handle OPTIONS preflight request
  if (event.httpMethod === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request for tournaments');
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    const path = event.path
      .replace(/^\/\.netlify\/functions\/tournaments\/?/, '/api/')
      .replace(/^\/api\/api\/?/, '/api/')
      .replace(/^\/+/, '/')
      .replace(/\/+$/, '');
    console.log('Normalized path:', path);

    const token = event.headers['authorization']?.split(' ')[1];
    console.log('Authorization token:', token);

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
      console.log('Handling /api/tournaments GET request');
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
      console.log('Tournaments retrieved:', data);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ tournaments: data })
      };
    }

    // Route: PUT /api/tournaments/:id (Admin Only)
    if (path.startsWith('/api/tournaments/') && event.httpMethod === 'PUT') {
      const tournamentId = path.split('/')[3];
      console.log('Handling /api/tournaments/:id PUT request, tournamentId:', tournamentId);
      const { name, start_date, end_date } = JSON.parse(event.body || '{}');
      console.log('PUT /api/tournaments/:id body:', { name, start_date, end_date });
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
      const { data: existingTournament, error: fetchError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('tournament_id', tournamentId)
        .single();
      console.log('Tournament fetch result:', { existingTournament, fetchError });
      if (fetchError || !existingTournament) {
        console.error('Tournament not found:', fetchError?.message);
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Tournament not found' })
        };
      }
      const { data, error } = await supabase
        .from('tournaments')
        .update({ name, start_date, end_date })
        .eq('tournament_id', tournamentId)
        .select()
        .single();
      console.log('Tournament update result:', { data, error });
      if (error || !data) {
        console.error('Tournament update error:', error?.message);
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Tournament not found' })
        };
      }
      console.log('Tournament updated:', data);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(data)
      };
    }

    // Route: DELETE /api/tournaments/:id (Admin Only)
    if (path.startsWith('/api/tournaments/') && event.httpMethod === 'DELETE') {
      const tournamentId = path.split('/')[3];
      console.log('Handling /api/tournaments/:id DELETE request, tournamentId:', tournamentId);

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
          body: JSON.stringify({ error: 'Forbidden: Only admins can delete tournaments' })
        };
      }

      const { data: existingTournament, error: fetchError } = await supabase
        .from('tournaments')
        .select('*')
        .eq('tournament_id', tournamentId)
        .single();
      console.log('Tournament fetch result:', { existingTournament, fetchError });
      if (fetchError || !existingTournament) {
        console.error('Tournament not found:', fetchError?.message);
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Tournament not found' })
        };
      }

      const { data: associatedParticipants, error: participantError } = await supabase
        .from('tournament_participants')
        .select('id')
        .eq('tournament_id', tournamentId);
      console.log('Associated participants check:', { associatedParticipants, participantError });
      if (participantError) {
        console.error('Error checking associated participants:', participantError.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: participantError.message })
        };
      }
      if (associatedParticipants && associatedParticipants.length > 0) {
        console.log('Cannot delete tournament with associated participants:', associatedParticipants.length);
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden: Cannot delete tournament with associated participants' })
        };
      }

      const { data: associatedCourses, error: courseError } = await supabase
        .from('tournament_courses')
        .select('id')
        .eq('tournament_id', tournamentId);
      console.log('Associated courses check:', { associatedCourses, courseError });
      if (courseError) {
        console.error('Error checking associated courses:', courseError.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: courseError.message })
        };
      }
      if (associatedCourses && associatedCourses.length > 0) {
        console.log('Cannot delete tournament with associated courses:', associatedCourses.length);
        return {
          statusCode: 403,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Forbidden: Cannot delete tournament with associated courses' })
        };
      }

      const { data, error } = await supabase
        .from('tournaments')
        .delete()
        .eq('tournament_id', tournamentId)
        .select()
        .single();
      console.log('Tournament deletion result:', { data, error });
      if (error || !data) {
        console.error('Tournament deletion error:', error?.message);
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Tournament not found' })
        };
      }
      console.log('Tournament deleted:', tournamentId);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(data)
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

    // Route: GET /api/tournament-participants/:tournament_id
    if (path.startsWith('/api/tournament-participants/') && event.httpMethod === 'GET') {
      const tournamentId = path.split('/')[3];
      console.log('Handling /api/tournament-participants/:tournament_id GET request, tournamentId:', tournamentId);

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
        .from('tournament_participants')
        .select('id, user_id, users!tournament_participants_user_id_fkey(user_id, name, email, handicap)')
        .eq('tournament_id', tournamentId);

      if (error) {
        console.error('Tournament participants retrieval error:', error.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message })
        };
      }

      console.log('Tournament participants retrieved:', data);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ participants: data })
      };
    }

    // Route: DELETE /api/tournament-participants/:id (Admin Only)
    if (path.startsWith('/api/tournament-participants/') && event.httpMethod === 'DELETE') {
      const participantId = path.split('/')[3];
      console.log('Handling /api/tournament-participants/:id DELETE request, participantId:', participantId);

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

      const { data: participantData, error: fetchError } = await supabase
        .from('tournament_participants')
        .select('id')
        .eq('id', participantId)
        .single();
      if (fetchError || !participantData) {
        console.error('Participant not found:', fetchError?.message);
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Participant not found' })
        };
      }

      const { error: deleteError } = await supabase
        .from('tournament_participants')
        .delete()
        .eq('id', participantId);
      if (deleteError) {
        console.error('Participant deletion error:', deleteError.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: deleteError.message })
        };
      }

      console.log('Participant deleted:', participantId);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Participant deleted successfully' })
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

    // Route: GET /api/tournament-courses/:tournament_id
    if (path.startsWith('/api/tournament-courses/') && event.httpMethod === 'GET') {
      const tournamentId = path.split('/')[3];
      console.log('Handling /api/tournament-courses/:tournament_id GET request, tournamentId:', tournamentId);

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
        .from('tournament_courses')
        .select('id, course_id, play_date, courses!tournament_courses_course_id_fkey(course_id, name, location)')
        .eq('tournament_id', tournamentId);

      if (error) {
        console.error('Tournament courses retrieval error:', error.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message })
        };
      }

      console.log('Tournament courses retrieved:', data);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ courses: data })
      };
    }

    // Route: PUT /api/tournament-courses/:id (Admin Only)
    if (path.startsWith('/api/tournament-courses/') && event.httpMethod === 'PUT') {
      const courseAssignmentId = path.split('/')[3];
      console.log('Handling /api/tournament-courses/:id PUT request, courseAssignmentId:', courseAssignmentId);
      const { play_date } = JSON.parse(event.body || '{}');

      if (!play_date || !/^\d{4}-\d{2}-\d{2}$/.test(play_date)) {
        console.log('Missing or invalid play_date');
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'play_date (YYYY-MM-DD) is required' })
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

      const { data: assignmentData, error: fetchError } = await supabase
        .from('tournament_courses')
        .select('id')
        .eq('id', courseAssignmentId)
        .single();
      if (fetchError || !assignmentData) {
        console.error('Course assignment not found:', fetchError?.message);
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Course assignment not found' })
        };
      }

      const { data, error } = await supabase
        .from('tournament_courses')
        .update({ play_date })
        .eq('id', courseAssignmentId)
        .select()
        .single();
      if (error || !data) {
        console.error('Course assignment update error:', error?.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: error.message })
        };
      }

      console.log('Course assignment updated:', data);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(data)
      };
    }

    // Route: DELETE /api/tournament-courses/:id (Admin Only)
    if (path.startsWith('/api/tournament-courses/') && event.httpMethod === 'DELETE') {
      const courseAssignmentId = path.split('/')[3];
      console.log('Handling /api/tournament-courses/:id DELETE request, courseAssignmentId:', courseAssignmentId);

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

      const { data: assignmentData, error: fetchError } = await supabase
        .from('tournament_courses')
        .select('id')
        .eq('id', courseAssignmentId)
        .single();
      if (fetchError || !assignmentData) {
        console.error('Course assignment not found:', fetchError?.message);
        return {
          statusCode: 404,
          headers: corsHeaders,
          body: JSON.stringify({ error: 'Course assignment not found' })
        };
      }

      const { error: deleteError } = await supabase
        .from('tournament_courses')
        .delete()
        .eq('id', courseAssignmentId);
      if (deleteError) {
        console.error('Course assignment deletion error:', deleteError.message);
        return {
          statusCode: 400,
          headers: corsHeaders,
          body: JSON.stringify({ error: deleteError.message })
        };
      }

      console.log('Course assignment deleted:', courseAssignmentId);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'Course assignment deleted successfully' })
      };
    }

    // If no route matches
    console.log('No matching route found for:', path, event.httpMethod);
    return {
      statusCode: 404,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Not Found' })
    };
  } catch (error) {
    console.error('Error in tournaments handler:', error.message, error.stack);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: 'Internal Server Error: ' + error.message })
    };
  }
};