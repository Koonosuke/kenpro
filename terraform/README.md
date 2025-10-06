# Recycle Point System - Terraform Infrastructure

企業レベルのTerraform構成でリサイクルポイントシステムのインフラストラクチャを管理します。

## 📁 ディレクトリ構成

```
terraform/
├── main.tf                    # メインのTerraform設定
├── dynamodb.tf               # DynamoDBテーブル設定
├── variables.tf              # 変数定義
├── terraform.tfvars.example  # 変数ファイルの例
├── environments/             # 環境別設定
│   ├── dev.tfvars           # 開発環境設定
│   └── production.tfvars    # 本番環境設定
├── scripts/                 # デプロイスクリプト
│   ├── deploy.sh            # Linux/Mac用デプロイスクリプト
│   └── deploy.ps1           # Windows用デプロイスクリプト
└── README.md                # このファイル
```

## 🚀 クイックスタート

### 1. 前提条件

- Terraform >= 1.0
- AWS CLI が設定済み
- 適切なAWS権限

### 2. 設定

```bash
# 変数ファイルをコピー
cp terraform.tfvars.example terraform.tfvars

# 環境に応じて設定を編集
# terraform.tfvars
```

### 3. デプロイ

#### Windows (PowerShell)
```powershell
# 開発環境にデプロイ
.\scripts\deploy.ps1 dev deploy

# 本番環境のプラン確認
.\scripts\deploy.ps1 production plan
```

#### Linux/Mac (Bash)
```bash
# 開発環境にデプロイ
./scripts/deploy.sh dev deploy

# 本番環境のプラン確認
./scripts/deploy.sh production plan
```

## 🏗️ インフラストラクチャ構成

### DynamoDBテーブル

| テーブル名 | 用途 | 主キー | GSI |
|---|---|---|---|
| `qr-tokens` | QRトークン管理 | `token_id` | `user-id-index`, `location-id-index`, `expires-at-index` |
| `locations` | 設置場所管理 | `location_id` | - |
| `recycle-events` | リサイクルイベントログ | `event_id` | `location-id-index`, `created-at-index` |
| `users` | ユーザー情報 | `user_id` | `email-index` |
| `points-ledger` | ポイント取引履歴 | `transaction_id` | `user-id-index`, `created-at-index` |
| `rewards` | 景品マスタ | `reward_id` | - |

### セキュリティ機能

- **暗号化**: すべてのテーブルでサーバーサイド暗号化有効
- **削除保護**: 本番環境で削除保護有効
- **ポイントインタイムリカバリ**: 本番環境で有効
- **アクセスログ**: CloudTrailで監査

### 監視・アラート

- **CloudWatchアラーム**: スロットリング、容量使用率監視
- **SNS通知**: アラート通知
- **自動スケーリング**: プロビジョンドモードでの自動スケーリング

## 🔧 環境別設定

### 開発環境 (dev)
- コスト最適化
- 削除保護無効
- 最小限の監視
- 短期間のバックアップ

### 本番環境 (production)
- 高可用性
- 最大セキュリティ
- 包括的監視
- 長期バックアップ

## 📊 コスト最適化

### DynamoDB
- **オンデマンド課金**: 開発環境で使用
- **プロビジョンド課金**: 本番環境で予測可能なワークロードに使用
- **自動スケーリング**: プロビジョンドモードでの自動調整

### 監視
- 必要最小限のアラーム
- 適切な閾値設定
- 不要なメトリクスの無効化

## 🔒 セキュリティ

### IAM
- 最小権限の原則
- 環境別の権限分離
- 定期的な権限監査

### 暗号化
- 保存時暗号化
- 転送時暗号化
- キー管理

### 監査
- CloudTrailログ
- 設定変更の追跡
- アクセスログの監視

## 🚨 トラブルシューティング

### よくある問題

1. **Terraform初期化エラー**
   ```bash
   # バックエンド設定を確認
   terraform init -reconfigure
   ```

2. **権限エラー**
   ```bash
   # AWS認証情報を確認
   aws sts get-caller-identity
   ```

3. **リソース制限エラー**
   - AWSサポートに制限緩和を依頼
   - リージョンを変更

### ログ確認

```bash
# Terraformログ
export TF_LOG=DEBUG
terraform apply

# AWS CLIログ
aws logs describe-log-groups --log-group-name-prefix "/aws/dynamodb"
```

## 📈 スケーリング

### 水平スケーリング
- DynamoDBの自動スケーリング
- リージョン間のレプリケーション
- 読み取りレプリカの活用

### 垂直スケーリング
- インスタンスタイプの変更
- メモリとCPUの調整
- ストレージの最適化

## 🔄 CI/CD統合

### GitHub Actions例

```yaml
name: Deploy Infrastructure
on:
  push:
    branches: [main]
    paths: ['terraform/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: hashicorp/setup-terraform@v1
      - name: Deploy
        run: ./terraform/scripts/deploy.sh production deploy
```

## 📞 サポート

- **ドキュメント**: このREADME
- **Issues**: GitHub Issues
- **Slack**: #infrastructure-support
- **緊急時**: オンコールエンジニア

## 📝 変更履歴

- v1.0.0: 初期リリース
- v1.1.0: 監視機能追加
- v1.2.0: セキュリティ強化
