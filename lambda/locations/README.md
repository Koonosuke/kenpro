# Locations Lambda Function

位置情報を取得するLambda関数です。

## 機能

- 全位置情報の取得
- 特定位置情報の取得（ID指定）
- ステータスフィルタリング

## API エンドポイント

### GET /locations
全位置情報を取得します。

**クエリパラメータ:**
- `status` (optional): ステータスでフィルタリング（active, maintenance, offline）

**レスポンス:**
```json
{
  "locations": [
    {
      "location_id": "location_001",
      "name": "Shibuya Station",
      "address": "1-1-1 Dogenzaka, Shibuya-ku, Tokyo",
      "latitude": 35.6581,
      "longitude": 139.7016,
      "status": "active",
      "points_per_recycle": 10,
      "description": "Main entrance recycle box at Shibuya Station",
      "created_at": "2024-01-01T00:00:00Z",
      "updated_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total_count": 1
}
```

### GET /locations/{location_id}
特定の位置情報を取得します。

**レスポンス:**
```json
{
  "location": {
    "location_id": "location_001",
    "name": "Shibuya Station",
    "address": "1-1-1 Dogenzaka, Shibuya-ku, Tokyo",
    "latitude": 35.6581,
    "longitude": 139.7016,
    "status": "active",
    "points_per_recycle": 10,
    "description": "Main entrance recycle box at Shibuya Station",
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

## 環境変数

- `LOCATIONS_TABLE_NAME`: DynamoDBテーブル名（デフォルト: recycle-system-dev-locations）

## デプロイ

```bash
# 依存関係インストール
npm install

# ZIPファイル作成
zip -r locations-lambda.zip .

# AWS CLIでデプロイ
aws lambda create-function \
  --function-name recycle-system-dev-locations \
  --runtime nodejs18.x \
  --role arn:aws:iam::YOUR_ACCOUNT:role/lambda-execution-role \
  --handler index.handler \
  --zip-file fileb://locations-lambda.zip \
  --region us-east-1
```

## テスト

```bash
# 全位置情報取得テスト
aws lambda invoke \
  --function-name recycle-system-dev-locations \
  --payload '{"httpMethod":"GET","queryStringParameters":{}}' \
  --region us-east-1 \
  response.json

# 特定位置情報取得テスト
aws lambda invoke \
  --function-name recycle-system-dev-locations \
  --payload '{"httpMethod":"GET","queryStringParameters":{"location_id":"location_001"}}' \
  --region us-east-1 \
  response.json
```
