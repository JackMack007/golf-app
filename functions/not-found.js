const { corsHeaders } = require('./utils');

exports.handler = async function(event, context) {
  console.log('Handling not-found request:', event.path, event.httpMethod);
  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Not Found' })
  };
};