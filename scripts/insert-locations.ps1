# DynamoDB locationsテーブルにサンプルデータを投入するスクリプト

$tableName = "recycle-system-dev-locations"
$region = "us-east-1"

Write-Host "DynamoDB locationsテーブルにサンプルデータを投入中..." -ForegroundColor Green

# サンプルデータ
$locations = @(
    @{
        location_id = "location_001"
        name = "渋谷駅前"
        address = "東京都渋谷区道玄坂1-1-1"
        latitude = 35.6581
        longitude = 139.7016
        status = "active"
        points_per_recycle = 10
        description = "渋谷駅前メインエントランスのリサイクルボックス"
        created_at = "2024-01-01T00:00:00Z"
        updated_at = "2024-01-15T10:30:00Z"
    },
    @{
        location_id = "location_002"
        name = "新宿駅東口"
        address = "東京都新宿区新宿3-38-1"
        latitude = 35.6909
        longitude = 139.7005
        status = "active"
        points_per_recycle = 10
        description = "新宿駅東口広場のリサイクルボックス"
        created_at = "2024-01-01T00:00:00Z"
        updated_at = "2024-01-15T10:30:00Z"
    },
    @{
        location_id = "location_003"
        name = "池袋駅西口"
        address = "東京都豊島区西池袋1-1-25"
        latitude = 35.7295
        longitude = 139.7109
        status = "active"
        points_per_recycle = 10
        description = "池袋駅西口ペデストリアンデッキのリサイクルボックス"
        created_at = "2024-01-01T00:00:00Z"
        updated_at = "2024-01-15T10:30:00Z"
    },
    @{
        location_id = "location_004"
        name = "上野駅中央口"
        address = "東京都台東区上野7-1-1"
        latitude = 35.7138
        longitude = 139.7773
        status = "active"
        points_per_recycle = 10
        description = "上野駅中央口改札前のリサイクルボックス"
        created_at = "2024-01-01T00:00:00Z"
        updated_at = "2024-01-15T10:30:00Z"
    },
    @{
        location_id = "location_005"
        name = "品川駅港南口"
        address = "東京都港区港南2-1-1"
        latitude = 35.6284
        longitude = 139.7387
        status = "active"
        points_per_recycle = 10
        description = "品川駅港南口バスターミナル前のリサイクルボックス"
        created_at = "2024-01-01T00:00:00Z"
        updated_at = "2024-01-15T10:30:00Z"
    },
    @{
        location_id = "location_006"
        name = "東京駅八重洲口"
        address = "東京都千代田区丸の内1-9-1"
        latitude = 35.6812
        longitude = 139.7671
        status = "maintenance"
        points_per_recycle = 10
        description = "東京駅八重洲口地下街のリサイクルボックス（メンテナンス中）"
        created_at = "2024-01-01T00:00:00Z"
        updated_at = "2024-01-15T10:30:00Z"
    },
    @{
        location_id = "location_007"
        name = "横浜駅西口"
        address = "神奈川県横浜市西区南幸1-1-1"
        latitude = 35.4658
        longitude = 139.6208
        status = "active"
        points_per_recycle = 10
        description = "横浜駅西口みなみ西口のリサイクルボックス"
        created_at = "2024-01-01T00:00:00Z"
        updated_at = "2024-01-15T10:30:00Z"
    },
    @{
        location_id = "location_008"
        name = "川崎駅東口"
        address = "神奈川県川崎市川崎区駅前本町26-1"
        latitude = 35.5307
        longitude = 139.7003
        status = "active"
        points_per_recycle = 10
        description = "川崎駅東口ラゾーナ川崎前のリサイクルボックス"
        created_at = "2024-01-01T00:00:00Z"
        updated_at = "2024-01-15T10:30:00Z"
    }
)

# 各位置情報をDynamoDBに投入
foreach ($location in $locations) {
    Write-Host "投入中: $($location.name)" -ForegroundColor Yellow
    
    $item = @{
        "location_id" = @{ S = $location.location_id }
        "name" = @{ S = $location.name }
        "address" = @{ S = $location.address }
        "latitude" = @{ N = $location.latitude.ToString() }
        "longitude" = @{ N = $location.longitude.ToString() }
        "status" = @{ S = $location.status }
        "points_per_recycle" = @{ N = $location.points_per_recycle.ToString() }
        "description" = @{ S = $location.description }
        "created_at" = @{ S = $location.created_at }
        "updated_at" = @{ S = $location.updated_at }
    }
    
    try {
        aws dynamodb put-item --table-name $tableName --item (ConvertTo-Json $item -Depth 10) --region $region
        Write-Host "✓ 成功: $($location.name)" -ForegroundColor Green
    }
    catch {
        Write-Host "✗ エラー: $($location.name) - $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`nサンプルデータ投入完了！" -ForegroundColor Green
Write-Host "投入された位置情報数: $($locations.Count)" -ForegroundColor Cyan

# 確認用クエリ
Write-Host "`n確認用: テーブル内容を表示中..." -ForegroundColor Blue
aws dynamodb scan --table-name $tableName --region $region --select COUNT
