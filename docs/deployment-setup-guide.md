# デプロイ前の設定ガイド

## 📋 目次

1. [必須設定項目](#必須設定項目)
2. [AWS認証情報の設定](#aws認証情報の設定)
3. [Terraform設定ファイルの作成](#terraform設定ファイルの作成)
4. [S3バックエンドの設定](#s3バックエンドの設定)
5. [デプロイ手順](#デプロイ手順)
6. [トラブルシューティング](#トラブルシューティング)

---

## 必須設定項目

### 🚨 **設定が必要な項目**

#### **1. AWS認証情報**
- AWS CLIの設定
- 適切な権限の確認

#### **2. Terraform設定ファイル**
- `terraform.tfvars`の作成
- 環境変数の設定

#### **3. S3バックエンド（オプション）**
- S3バケットの作成
- DynamoDBロックテーブルの作成

---

## AWS認証情報の設定

### 🔑 **AWS CLIの設定**

#### **1. AWS CLIのインストール確認**
```powershell
# AWS CLIのバージョン確認
aws --version
```

#### **2. AWS認証情報の設定**
```powershell
# AWS認証情報の設定
aws configure
```

**設定項目:**
```
AWS Access Key ID: [あなたのアクセスキー]
AWS Secret Access Key: [あなたのシークレットキー]
Default region name: ap-northeast-1
Default output format: json
```

#### **3. 認証情報の確認**
```powershell
# 現在の認証情報を確認
aws sts get-caller-identity
```

**期待される出力:**
```json
{
    "UserId": "AIDACKCEVSQ6C2EXAMPLE",
    "Account": "123456789012",
    "Arn": "arn:aws:iam::123456789012:user/your-username"
}
```

### 🔐 **必要な権限**

#### **DynamoDB権限**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:CreateTable",
                "dynamodb:DescribeTable",
                "dynamodb:UpdateTable",
                "dynamodb:DeleteTable",
                "dynamodb:ListTables",
                "dynamodb:TagResource",
                "dynamodb:UntagResource"
            ],
            "Resource": "*"
        }
    ]
}
```

#### **IAM権限（S3バックエンド使用時）**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:PutObject",
                "s3:DeleteObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::your-terraform-state-bucket",
                "arn:aws:s3:::your-terraform-state-bucket/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "dynamodb:GetItem",
                "dynamodb:PutItem",
                "dynamodb:DeleteItem"
            ],
            "Resource": "arn:aws:dynamodb:ap-northeast-1:123456789012:table/terraform-lock"
        }
    ]
}
```

---

## Terraform設定ファイルの作成

### 📝 **terraform.tfvarsの作成**

#### **1. 設定ファイルのコピー**
```powershell
# 設定例ファイルをコピー
cd terraform
copy terraform.tfvars.example terraform.tfvars
```

#### **2. 設定ファイルの編集**
```hcl
# terraform.tfvars
# 開発環境用の設定

# General Configuration
aws_region   = "ap-northeast-1"
environment  = "dev"
project_name = "recycle-system"
team_name    = "your-team-name"
cost_center  = "engineering"

# Note: 最小構成では追加設定は不要
```

### 🌍 **環境変数の設定（オプション）**

#### **PowerShellでの環境変数設定**
```powershell
# 環境変数の設定
$env:TF_VAR_aws_region = "ap-northeast-1"
$env:TF_VAR_environment = "dev"
$env:TF_VAR_project_name = "recycle-system"
$env:TF_VAR_team_name = "your-team-name"
$env:TF_VAR_cost_center = "engineering"
```

#### **永続的な環境変数設定**
```powershell
# システム環境変数として設定
[Environment]::SetEnvironmentVariable("TF_VAR_aws_region", "ap-northeast-1", "User")
[Environment]::SetEnvironmentVariable("TF_VAR_environment", "dev", "User")
[Environment]::SetEnvironmentVariable("TF_VAR_project_name", "recycle-system", "User")
[Environment]::SetEnvironmentVariable("TF_VAR_team_name", "your-team-name", "User")
[Environment]::SetEnvironmentVariable("TF_VAR_cost_center", "engineering", "User")
```

---

## S3バックエンドの設定

### 🗄️ **S3バックエンド（オプション）**

#### **現在の設定（ローカルステート）**
```hcl
# main.tf - 現在はコメントアウト
# backend "s3" {
#   bucket = "your-terraform-state-bucket"
#   key    = "recycle-system/terraform.tfstate"
#   region = "ap-northeast-1"
# }
```

#### **S3バックエンドを使用する場合**

##### **1. S3バケットの作成**
```powershell
# S3バケットの作成
aws s3 mb s3://your-terraform-state-bucket --region ap-northeast-1
```

##### **2. DynamoDBロックテーブルの作成**
```powershell
# DynamoDBロックテーブルの作成
aws dynamodb create-table \
    --table-name terraform-lock \
    --attribute-definitions AttributeName=LockID,AttributeType=S \
    --key-schema AttributeName=LockID,KeyType=HASH \
    --provisioned-throughput ReadCapacityUnits=5,WriteCapacityUnits=5 \
    --region ap-northeast-1
```

##### **3. main.tfの修正**
```hcl
# main.tf - S3バックエンドを有効化
backend "s3" {
  bucket         = "your-terraform-state-bucket"
  key            = "recycle-system/terraform.tfstate"
  region         = "ap-northeast-1"
  encrypt        = true
  dynamodb_table = "terraform-lock"
}
```

---

## デプロイ手順

### 🚀 **基本的なデプロイ手順**

#### **1. 事前確認**
```powershell
# 現在のディレクトリ確認
pwd
# 出力: C:\Users\貸出アカウント\ALL\kenpro

# Terraformディレクトリに移動
cd terraform

# 設定ファイルの確認
ls terraform.tfvars
```

#### **2. Terraformの初期化**
```powershell
# Terraformの初期化
terraform init
```

#### **3. プランの確認**
```powershell
# プランの確認
terraform plan -var-file="environments/dev.tfvars"
```

#### **4. デプロイの実行**
```powershell
# デプロイの実行
terraform apply -var-file="environments/dev.tfvars"
```

### 🎯 **デプロイスクリプトの使用**

#### **PowerShellスクリプトの使用**
```powershell
# 開発環境へのデプロイ
.\scripts\deploy.ps1 dev deploy

# プランの確認のみ
.\scripts\deploy.ps1 dev plan

# 本番環境へのデプロイ
.\scripts\deploy.ps1 production deploy
```

#### **スクリプトの実行権限設定**
```powershell
# 実行ポリシーの確認
Get-ExecutionPolicy

# 実行ポリシーの設定（必要に応じて）
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## トラブルシューティング

### 🚨 **よくある問題と解決方法**

#### **1. AWS認証エラー**
```
Error: No valid credential sources found
```

**解決方法:**
```powershell
# AWS認証情報の再設定
aws configure
```

#### **2. 権限不足エラー**
```
Error: AccessDenied: User is not authorized to perform: dynamodb:CreateTable
```

**解決方法:**
- IAMユーザーにDynamoDB権限を追加
- 管理者権限の確認

#### **3. リージョンエラー**
```
Error: InvalidParameterValue: Invalid region
```

**解決方法:**
```powershell
# リージョンの確認
aws configure get region

# リージョンの設定
aws configure set region ap-northeast-1
```

#### **4. Terraformバージョンエラー**
```
Error: Unsupported Terraform Core version
```

**解決方法:**
```powershell
# Terraformのバージョン確認
terraform version

# 最新版のインストール
# https://www.terraform.io/downloads.html
```

### 🔍 **デバッグ方法**

#### **詳細ログの有効化**
```powershell
# 詳細ログの有効化
$env:TF_LOG = "DEBUG"
$env:TF_LOG_PATH = "terraform.log"

# Terraformの実行
terraform apply

# ログの確認
Get-Content terraform.log
```

#### **状態ファイルの確認**
```powershell
# 状態ファイルの確認
terraform state list

# 特定リソースの確認
terraform state show aws_dynamodb_table.tables["qr_tokens"]
```

---

## 設定チェックリスト

### ✅ **デプロイ前の確認項目**

#### **AWS認証**
- [ ] AWS CLIがインストールされている
- [ ] `aws configure`で認証情報を設定済み
- [ ] `aws sts get-caller-identity`で認証確認済み
- [ ] 必要な権限が付与されている

#### **Terraform設定**
- [ ] `terraform.tfvars`ファイルを作成済み
- [ ] 必要な変数が設定済み
- [ ] 環境変数が設定済み（オプション）

#### **S3バックエンド（オプション）**
- [ ] S3バケットが作成済み
- [ ] DynamoDBロックテーブルが作成済み
- [ ] `main.tf`でS3バックエンドが有効化済み

#### **デプロイ準備**
- [ ] Terraformがインストールされている
- [ ] 適切なディレクトリにいる
- [ ] 設定ファイルが存在する

### 🎯 **最小構成でのデプロイ**

#### **必要な設定のみ**
```hcl
# terraform.tfvars（最小構成）
aws_region   = "ap-northeast-1"
environment  = "dev"
project_name = "recycle-system"
team_name    = "your-team-name"
cost_center  = "engineering"
```

#### **デプロイコマンド**
```powershell
# 最小構成でのデプロイ
cd terraform
terraform init
terraform plan -var-file="environments/dev.tfvars"
terraform apply -var-file="environments/dev.tfvars"
```

---

## まとめ

### 🎯 **デプロイ前の必須設定**

1. **AWS認証情報**: `aws configure`で設定
2. **terraform.tfvars**: 設定ファイルの作成
3. **権限確認**: DynamoDB権限の確認

### 🚀 **推奨デプロイ手順**

1. **設定確認**: 上記チェックリストの確認
2. **プラン確認**: `terraform plan`で変更内容の確認
3. **デプロイ実行**: `terraform apply`でデプロイ

### 💡 **トラブルシューティング**

- **認証エラー**: `aws configure`の再実行
- **権限エラー**: IAM権限の確認
- **設定エラー**: `terraform.tfvars`の確認

**準備ができたら、安心してデプロイを開始できます！**

