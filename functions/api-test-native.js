exports.handler = async function(event, context) {
  console.log('Initializing api-test-native');
  console.log('Raw event path:', event.path, 'Method:', event.httpMethod);
  try {
    // Normalize path by removing Netlify function prefix and ensuring single leading slash
    let path = event.path
      .replace(/^\/\.netlify\/functions\/api-test-native\/?/, '/')
      .replace(/^\/api-test-native\/?/, '/')
      .replace(/^\/+/, '/'); // Ensure single leading slash
    console.log('Normalized path:', path);
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
    console.log('No matching route:', path, event.httpMethod);
    return {
      statusCode: 404,
      body: JSON.stringify({ error: 'Not found' }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  } catch (error) {
    console.error('Error in api-test-native:', error.message, error.stack);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server error' }),
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }
};