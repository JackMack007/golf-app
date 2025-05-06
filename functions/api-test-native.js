exports.handler = async function(event, context) {
  console.log('Initializing api-test-native');
  try {
    if (event.path === '/api/health' && event.httpMethod === 'GET') {
      console.log('Handling /api/health request');
      return {
        statusCode: 200,
        body: JSON.stringify({ status: 'Server is running' }),
        headers: {
          'Content-Type': 'application/json'
        }
      };
    }
    console.log('No matching route:', event.path, event.httpMethod);
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