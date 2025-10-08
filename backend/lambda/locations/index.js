const AWS = require('aws-sdk');

const dynamodb = new AWS.DynamoDB.DocumentClient();
const tableName = process.env.LOCATIONS_TABLE_NAME || 'recycle-system-dev-locations';

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  try {
    // CORS headers
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Content-Type': 'application/json'
    };

    // Handle preflight OPTIONS request
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'CORS preflight' })
      };
    }

    // Only allow GET requests
    if (event.httpMethod !== 'GET') {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      };
    }

    // Parse query parameters
    const queryParams = event.queryStringParameters || {};
    const locationId = queryParams.location_id;
    const status = queryParams.status;

    let result;

    if (locationId) {
      // Get specific location by ID
      result = await getLocationById(locationId);
    } else {
      // Get all locations with optional status filter
      result = await getAllLocations(status);
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    };

  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
};

async function getLocationById(locationId) {
  const params = {
    TableName: tableName,
    Key: {
      location_id: locationId
    }
  };

  const result = await dynamodb.get(params).promise();
  
  if (!result.Item) {
    throw new Error('Location not found');
  }

  return {
    location: result.Item
  };
}

async function getAllLocations(statusFilter = null) {
  const params = {
    TableName: tableName
  };

  // Add filter expression if status is specified
  if (statusFilter) {
    params.FilterExpression = '#status = :status';
    params.ExpressionAttributeNames = {
      '#status': 'status'
    };
    params.ExpressionAttributeValues = {
      ':status': statusFilter
    };
  }

  const result = await dynamodb.scan(params).promise();
  
  return {
    locations: result.Items || [],
    total_count: result.Count || 0
  };
}
