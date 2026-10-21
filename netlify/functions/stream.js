const { streamResponse } = require('../../server/streamSource');

exports.handler = (event) => streamResponse(event.queryStringParameters || {}, event.httpMethod);
