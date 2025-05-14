const { createClient } = require('@supabase/supabase-js');

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
    console.error('checkUserRole - No authorization token provided');
    return 'user'; // Default to 'user' if no token
  }
  console.log('checkUserRole - Validating token:', token);
  const { data: sessionData, error: sessionError } = await supabase.auth.getUser(token);
  if (sessionError || !sessionData?.user) {
    console.error('checkUserRole - Session error:', sessionError?.message);
    return 'user'; // Default to 'user' if token is invalid
  }
  const userId = sessionData.user.id;
  console.log('checkUserRole - Retrieved userId from token:', userId);

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('user_role')
    .eq('auth_user_id', userId);
  console.log('checkUserRole - Query result:', { userData, userError });

  if (userError || !userData || userData.length === 0) {
    console.error('checkUserRole - User fetch error or no user found:', userError?.message);
    console.log('checkUserRole - Defaulting to user role');
    return 'user'; // Default to 'user' if not found
  }
  if (userData.length > 1) {
    console.error('checkUserRole - Multiple users found for auth_user_id:', userId);
    console.log('checkUserRole - Defaulting to user role');
    return 'user'; // Default to 'user' if multiple rows
  }
  const userRole = userData[0].user_role;
  console.log('checkUserRole - User role:', userRole);
  return userRole || 'user';
};

// Helper function to initialize Supabase client
const initializeSupabase = () => {
  try {
    console.log('Initializing Supabase client with URL:', process.env.SUPABASE_URL);
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
      throw new Error('Supabase URL and key are required');
    }
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);
    console.log('Supabase client initialized successfully');
    return supabase;
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error.message, error.stack);
    throw error;
  }
};

module.exports = { corsHeaders, checkUserRole, initializeSupabase };