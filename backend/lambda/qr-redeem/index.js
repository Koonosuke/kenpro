const AWS = require("aws-sdk");
const { randomUUID } = require("crypto");

const dynamo = new AWS.DynamoDB.DocumentClient();

const QR_TOKENS_TABLE_NAME =
  process.env.QR_TOKENS_TABLE_NAME || "recycle-system-dev-qr-tokens";
const USERS_TABLE_NAME =
  process.env.USERS_TABLE_NAME || "recycle-system-dev-users";
const POINTS_LEDGER_TABLE_NAME =
  process.env.POINTS_LEDGER_TABLE_NAME || "recycle-system-dev-points-ledger";
const DEFAULT_POINTS = Number(process.env.DEFAULT_QR_POINTS || "10");

exports.handler = async (event) => {
  try {
    const body = parseBody(event.body);
    const qrTokenId = body?.qr_token;
    if (!qrTokenId) {
      return response(400, {
        error: "QR_TOKEN_REQUIRED",
        message: "qr_token を指定してください。",
      });
    }

    const userId = extractUserId(event, body);
    if (!userId) {
      return response(401, {
        error: "UNAUTHORIZED",
        message: "ユーザーを特定できません。",
      });
    }

    const now = new Date();
    const nowIso = now.toISOString();

    const tokenRecord = await dynamo
      .get({
        TableName: QR_TOKENS_TABLE_NAME,
        Key: { token_id: qrTokenId },
      })
      .promise();

    const token = tokenRecord.Item;
    if (!token) {
      return response(400, {
        error: "QR_TOKEN_NOT_FOUND",
        message: "QRトークンが見つかりません。",
      });
    }

    if (
      token.status &&
      token.status.toLowerCase() !== "active" &&
      token.status.toLowerCase() !== "issued"
    ) {
      return response(400, {
        error: "QR_TOKEN_ALREADY_USED",
        message: "このQRトークンは既に使用済みです。",
      });
    }

    if (token.expires_at && new Date(token.expires_at) < now) {
      return response(400, {
        error: "QR_TOKEN_EXPIRED",
        message: "QRトークンの有効期限が切れています。",
      });
    }

    const pointsToAdd =
      typeof token.points_value === "number"
        ? token.points_value
        : DEFAULT_POINTS;

    const transactionId = `txn_${randomUUID()}`;

    try {
      await dynamo
        .transactWrite({
          TransactItems: [
            {
              Update: {
                TableName: USERS_TABLE_NAME,
                Key: { user_id: userId },
                UpdateExpression:
                  "SET points_balance = if_not_exists(points_balance, :zero) + :points, updated_at = :now",
                ConditionExpression: "attribute_exists(user_id)",
                ExpressionAttributeValues: {
                  ":points": pointsToAdd,
                  ":zero": 0,
                  ":now": nowIso,
                },
              },
            },
            {
              Update: {
                TableName: QR_TOKENS_TABLE_NAME,
                Key: { token_id: qrTokenId },
                UpdateExpression:
                  "SET #status = :redeemed, redeemed_at = :now, redeemed_by = :userId",
                ConditionExpression:
                  "attribute_not_exists(#status) OR #status = :active OR #status = :issued",
                ExpressionAttributeNames: {
                  "#status": "status",
                },
                ExpressionAttributeValues: {
                  ":redeemed": "redeemed",
                  ":active": "active",
                  ":issued": "issued",
                  ":now": nowIso,
                  ":userId": userId,
                },
              },
            },
            {
              Put: {
                TableName: POINTS_LEDGER_TABLE_NAME,
                Item: {
                  transaction_id: transactionId,
                  user_id: userId,
                  transaction_type: "earn",
                  source: "qr_redeem",
                  points_change: pointsToAdd,
                  qr_token_id: qrTokenId,
                  location_id: token.location_id ?? null,
                  created_at: nowIso,
                },
              },
            },
          ],
        })
        .promise();
    } catch (error) {
      if (error.code === "ConditionalCheckFailedException") {
        return response(400, {
          error: "DUPLICATE_REDEEM",
          message: "このQRトークンは既に使用されているか、ユーザーが存在しません。",
        });
      }
      throw error;
    }

    const updatedUser = await dynamo
      .get({
        TableName: USERS_TABLE_NAME,
        Key: { user_id: userId },
        ProjectionExpression: "points_balance",
      })
      .promise();

    const newBalance = updatedUser.Item?.points_balance ?? pointsToAdd;

    return response(200, {
      success: true,
      points_added: pointsToAdd,
      new_balance: newBalance,
      qr_token: qrTokenId,
      redeemed_at: nowIso,
    });
  } catch (error) {
    console.error("Redeem error", error);
    return response(500, {
      error: "INTERNAL_ERROR",
      message: "ポイント付与処理中にエラーが発生しました。",
    });
  }
};

function parseBody(body) {
  if (!body) return {};
  if (typeof body === "string") {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return body;
}

function extractUserId(event, body) {
  const authorizer = event?.requestContext?.authorizer;
  const claims = authorizer?.claims || authorizer?.jwt?.claims;
  if (claims) {
    return (
      claims.sub ||
      claims["cognito:username"] ||
      claims.username ||
      claims.user_id ||
      null
    );
  }

  if (event?.requestContext?.identity?.cognitoIdentityId) {
    return event.requestContext.identity.cognitoIdentityId;
  }

  if (body?.user_id) {
    return body.user_id;
  }

  return null;
}

function response(statusCode, payload) {
  return {
    statusCode,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(payload),
  };
}
