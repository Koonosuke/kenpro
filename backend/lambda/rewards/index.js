const AWS = require('aws-sdk');
const { randomUUID } = require('crypto');

const dynamodb = new AWS.DynamoDB.DocumentClient();

const rewardsTableName =
  process.env.REWARDS_TABLE_NAME || 'recycle-system-dev-rewards';
const usersTableName =
  process.env.USERS_TABLE_NAME || 'recycle-system-dev-users';
const pointsLedgerTableName =
  process.env.POINTS_LEDGER_TABLE_NAME ||
  'recycle-system-dev-points-ledger';
const defaultHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Content-Type': 'application/json',
};

exports.handler = async (event) => {
  console.log('Event:', JSON.stringify(event, null, 2));

  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: defaultHeaders,
      body: JSON.stringify({ message: 'CORS preflight' }),
    };
  }

  try {
    const routeKey = buildRouteKey(event);
    switch (routeKey) {
      case 'GET /rewards': {
        const queryParams = event.queryStringParameters || {};
        const isActiveParam = parseIsActive(queryParams.is_active);
        const rewards = await listRewards(isActiveParam);
        return successResponse(rewards);
      }
      case 'GET /rewards/{rewardId}': {
        const rewardId = getRewardId(event);
        const reward = await getRewardById(rewardId);
        return successResponse({ reward });
      }
      case 'POST /rewards/{rewardId}/exchange': {
        const rewardId = getRewardId(event);
        const userId = extractUserId(event);
        if (!userId) {
          return errorResponse(401, 'UNAUTHORIZED', 'User identification required');
        }
        const result = await exchangeReward(userId, rewardId);
        return successResponse(result);
      }
      default:
        return errorResponse(
          405,
          'METHOD_NOT_ALLOWED',
          `Unsupported route: ${routeKey}`,
        );
    }
  } catch (error) {
    console.error('Error:', error);
    if (error.isCustom) {
      return errorResponse(error.statusCode, error.code, error.message);
    }

    if (error.code === 'ConditionalCheckFailedException') {
      return errorResponse(
        400,
        'CONDITION_FAILED',
        'Failed to complete reward exchange due to conditional check',
      );
    }

    return errorResponse(
      500,
      'INTERNAL_SERVER_ERROR',
      error.message || 'Internal server error',
    );
  }
};

function buildRouteKey(event) {
  const { httpMethod, resource, path } = event;
  if (resource) {
    return `${httpMethod} ${resource}`;
  }
  return `${httpMethod} ${path}`;
}

function parseIsActive(value) {
  if (value === undefined || value === null) {
    return true;
  }
  if (typeof value === 'boolean') return value;
  const normalized = String(value).toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return null;
}

function extractUserId(event) {
  const authorizer = event.requestContext?.authorizer;
  if (!authorizer) return null;

  const claims = authorizer.claims || authorizer.jwt?.claims;
  if (!claims) return null;

  return (
    claims.sub ||
    claims.username ||
    claims['cognito:username'] ||
    claims.user_id ||
    null
  );
}

function getRewardId(event) {
  const rewardId = event.pathParameters?.rewardId || event.pathParameters?.id;
  if (!rewardId) {
    throw createError(400, 'INVALID_REWARD_ID', 'Reward ID is required');
  }
  return rewardId;
}

async function listRewards(isActive) {
  const params = {
    TableName: rewardsTableName,
  };

  if (isActive !== null) {
    params.FilterExpression = '#is_active = :isActive';
    params.ExpressionAttributeNames = {
      '#is_active': 'is_active',
    };
    params.ExpressionAttributeValues = {
      ':isActive': isActive,
    };
  }

  const result = await dynamodb.scan(params).promise();
  return {
    rewards: result.Items || [],
    total_count: result.Count || 0,
  };
}

async function getRewardById(rewardId) {
  const params = {
    TableName: rewardsTableName,
    Key: {
      reward_id: rewardId,
    },
  };

  const result = await dynamodb.get(params).promise();

  if (!result.Item) {
    throw createError(404, 'REWARD_NOT_FOUND', `Reward ${rewardId} not found`);
  }

  return result.Item;
}

async function exchangeReward(userId, rewardId) {
  const [reward, user] = await Promise.all([
    getRewardById(rewardId),
    getUserById(userId),
  ]);

  if (reward.is_active === false) {
    throw createError(400, 'REWARD_INACTIVE', 'This reward is not currently available');
  }

  if (typeof reward.stock_count === 'number' && reward.stock_count <= 0) {
    throw createError(400, 'REWARD_OUT_OF_STOCK', 'Reward is out of stock');
  }

  const now = new Date();
  if (reward.redeemable_from && now < new Date(reward.redeemable_from)) {
    throw createError(400, 'REWARD_NOT_AVAILABLE_YET', 'Reward is not yet redeemable');
  }
  if (reward.redeemable_until && now > new Date(reward.redeemable_until)) {
    throw createError(400, 'REWARD_EXPIRED', 'Reward redemption period has ended');
  }

  if (!user) {
    throw createError(404, 'USER_NOT_FOUND', 'User not found');
  }

  const pointsCost = reward.points_cost || 0;
  const userBalance = user.points_balance || 0;

  if (pointsCost <= 0) {
    throw createError(400, 'INVALID_POINTS_COST', 'Reward points cost must be positive');
  }

  if (userBalance < pointsCost) {
    throw createError(
      400,
      'INSUFFICIENT_POINTS',
      'Not enough points to exchange this reward',
    );
  }

  if (reward.redemption_limit_per_user) {
    const userRedemptionCount = await countUserRedemptions({
      userId,
      rewardId,
      limit: reward.redemption_limit_per_user,
    });
    if (userRedemptionCount >= reward.redemption_limit_per_user) {
      throw createError(
        400,
        'REDEMPTION_LIMIT_REACHED',
        'You have reached the redemption limit for this reward',
      );
    }
  }

  if (reward.redemption_limit_per_day) {
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    const dailyRedemptions = await countUserRedemptions({
      userId,
      rewardId,
      since: since.toISOString(),
      limit: reward.redemption_limit_per_day,
    });
    if (dailyRedemptions >= reward.redemption_limit_per_day) {
      throw createError(
        400,
        'DAILY_LIMIT_REACHED',
        'Daily redemption limit reached for this reward',
      );
    }
  }

  const nowIso = now.toISOString();
  const transactionId = `txn_${randomUUID()}`;

  await dynamodb
    .transactWrite({
      TransactItems: [
        {
          Update: {
            TableName: usersTableName,
            Key: { user_id: userId },
            UpdateExpression: 'SET points_balance = points_balance - :cost, updated_at = :now',
            ConditionExpression:
              'attribute_exists(user_id) AND points_balance >= :cost',
            ExpressionAttributeValues: {
              ':cost': pointsCost,
              ':now': nowIso,
            },
          },
        },
        {
          Update: {
            TableName: rewardsTableName,
            Key: { reward_id: rewardId },
            UpdateExpression:
              'SET stock_count = stock_count - :one, updated_at = :now, total_redeemed = if_not_exists(total_redeemed, :zero) + :one',
            ConditionExpression:
              'attribute_exists(reward_id) AND attribute_exists(stock_count) AND stock_count >= :one AND is_active = :true',
            ExpressionAttributeValues: {
              ':one': 1,
              ':zero': 0,
              ':true': true,
              ':now': nowIso,
            },
          },
        },
        {
          Put: {
            TableName: pointsLedgerTableName,
            Item: {
              transaction_id: transactionId,
              user_id: userId,
              points_change: -pointsCost,
              transaction_type: 'reward_exchange',
              reward_id: rewardId,
              created_at: nowIso,
              points_before: userBalance,
              points_after: userBalance - pointsCost,
            },
            ConditionExpression: 'attribute_not_exists(transaction_id)',
          },
        },
      ],
    })
    .promise();

  const [updatedUser, updatedReward] = await Promise.all([
    getUserById(userId),
    getRewardById(rewardId),
  ]);

  return {
    success: true,
    reward_id: rewardId,
    reward_name: updatedReward?.name ?? reward.name,
    points_used: pointsCost,
    new_balance: updatedUser?.points_balance ?? userBalance - pointsCost,
    exchange_id: transactionId,
    exchanged_at: nowIso,
    status: 'completed',
  };
}

async function getUserById(userId) {
  if (!userId) return null;
  const params = {
    TableName: usersTableName,
    Key: {
      user_id: userId,
    },
  };
  const result = await dynamodb.get(params).promise();
  return result.Item || null;
}

async function countUserRedemptions({ userId, rewardId, since, limit }) {
  const params = {
    TableName: pointsLedgerTableName,
    FilterExpression:
      '#user_id = :userId AND #type = :type AND #reward_id = :rewardId',
    ExpressionAttributeNames: {
      '#user_id': 'user_id',
      '#type': 'transaction_type',
      '#reward_id': 'reward_id',
    },
    ExpressionAttributeValues: {
      ':userId': userId,
      ':type': 'reward_exchange',
      ':rewardId': rewardId,
    },
    ProjectionExpression: 'transaction_id, created_at',
  };

  if (since) {
    params.FilterExpression += ' AND created_at >= :since';
    params.ExpressionAttributeValues[':since'] = since;
  }

  let count = 0;
  let lastEvaluatedKey;

  do {
    const response = await dynamodb
      .scan({ ...params, ExclusiveStartKey: lastEvaluatedKey })
      .promise();

    count += response.Count || 0;
    lastEvaluatedKey = response.LastEvaluatedKey;

    if (limit && count >= limit) {
      return count;
    }
  } while (lastEvaluatedKey);

  return count;
}

function createError(statusCode, code, message) {
  return {
    isCustom: true,
    statusCode,
    code,
    message,
  };
}

function successResponse(payload) {
  return {
    statusCode: 200,
    headers: defaultHeaders,
    body: JSON.stringify(payload),
  };
}

function errorResponse(statusCode, code, message) {
  return {
    statusCode,
    headers: defaultHeaders,
    body: JSON.stringify({
      error: code,
      message,
    }),
  };
}
