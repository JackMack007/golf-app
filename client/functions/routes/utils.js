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