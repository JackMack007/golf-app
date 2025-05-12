const { corsHeaders } = require('../utils');

const notFoundRoutes = async (event) => {
  console.log('Handling not-found request:', event.path, event.httpMethod);
  return {
    statusCode: 404,
    headers: corsHeaders,
    body: JSON.stringify({ error: 'Not Found' })
  };
};

module.exports = notFoundRoutes;