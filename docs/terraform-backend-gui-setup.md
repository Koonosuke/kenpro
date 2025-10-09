# Terraform Backend - GUI完全セットアップガイド

## 📋 このガイドの内容

1. S3バケットの作成（GUI）
2. DynamoDBテーブルの作成（GUI）
3. Terraformとの結びつけ方
4. 動作確認

所要時間：約10分

---

## 🎯 PART 1: S3バケットの作成

### STEP 1: S3コンソールを開く

1. AWSマネジメントコンソール（https://console.aws.amazon.com/）にログイン
2. 上部の検索バーに「**S3**」と入力
3. 「**S3**」をクリック

### STEP 2: バケットを作成

1. 画面右上の「**バケットを作成**」オレンジボタンをクリック

### STEP 3: 基本設定

#### 📝 バケット名
```
recycle-system-terraform-state-kenpro
```

**入力欄**: 「バケット名」

⚠️ **注意事項**:
- すべて小文字
- スペース不可
- すでに使われている場合は末尾に数字を追加
  例: `recycle-system-terraform-state-kenpro-2025`

#### 🌍 リージョン
```
米国東部 (バージニア北部) us-east-1
```

**プルダウン**: 「AWSリージョン」から選択

### STEP 4: オブジェクト所有者

そのまま（変更不要）

```
● ACL無効（推奨）  ← これが選択されていればOK
```

### STEP 5: パブリックアクセスをブロック ⭐超重要

**「このバケットのブロックパブリックアクセス設定」** セクション

```
☑ すべてのパブリックアクセスをブロック  ← 必ずチェック
```

これにチェックを入れると、下の4つすべてにチェックが入ります：
```
☑ 新しいアクセスコントロールリスト (ACL) を介して付与された...
☑ 任意のアクセスコントロールリスト (ACL) を介して付与された...
☑ 新しいパブリックバケットポリシーまたはアクセスポイントポリシー...
☑ 任意のパブリックバケットポリシーまたはアクセスポイントポリシー...
```

⚠️ 黄色い警告が表示されますが、これは正常です。

さらに下の確認チェックボックスにもチェック：
```
☑ 上記の設定によってこのバケットに対する現在および将来の
  パブリックアクセスがブロックされることを承認します
```

### STEP 6: バケットのバージョニング ⭐重要

**「バケットのバージョニング」** セクション

```
● 有効にする  ← 必ず選択
○ 無効にする
```

💡 **理由**: 過去のterraform.tfstateを保持して、いつでも戻せるようにするため

### STEP 7: タグ（オプション）

**「タグ - オプション」** セクション

タグを追加（推奨だが必須ではない）：

| キー | 値 |
|------|-----|
| `Project` | `recycle-system` |
| `Purpose` | `terraform-state` |
| `ManagedBy` | `gui` |

追加方法：
1. 「タグを追加」をクリック
2. キーと値を入力
3. 必要に応じて「タグを追加」で追加

### STEP 8: デフォルト暗号化 ⭐重要

**「デフォルト暗号化」** セクション

```
暗号化タイプ:
● サーバー側の暗号化 (SSE-S3)  ← これを選択
○ AWS Key Management Service キー (SSE-KMS)
```

「バケットキー」: そのまま（デフォルト）

💡 **理由**: terraform.tfstateを自動で暗号化（無料）

### STEP 9: 詳細設定

そのまま（変更不要）

### STEP 10: バケットを作成

1. 画面を下までスクロール
2. 右下の「**バケットを作成**」オレンジボタンをクリック
3. 緑色の成功メッセージが表示されればOK！

```
✅ バケット "recycle-system-terraform-state-kenpro" が正常に作成されました
```

### STEP 11: 設定を確認

作成したバケット名をクリックして確認：

#### 「プロパティ」タブ
- ✅ バケットのバージョニング: **有効**
- ✅ デフォルトの暗号化: **有効 (SSE-S3)**

#### 「アクセス許可」タブ
- ✅ パブリックアクセスをすべてブロック: **オン**

すべてOKなら完了！ 🎉

---

## 🔒 PART 2: DynamoDBテーブルの作成

### STEP 1: DynamoDBコンソールを開く

1. AWSマネジメントコンソールの上部検索バーに「**DynamoDB**」と入力
2. 「**DynamoDB**」をクリック

### STEP 2: テーブルを作成

1. 左サイドバーの「**テーブル**」をクリック（すでに選択されているかも）
2. 右上の「**テーブルの作成**」オレンジボタンをクリック

### STEP 3: テーブルの詳細

#### 📝 テーブル名
```
terraform-state-lock
```

**入力欄**: 「テーブル名」

⚠️ **超重要**: この名前は`terraform/backend.tf`の`dynamodb_table`と一致させる必要があります

#### 🔑 パーティションキー ⭐最重要

```
パーティションキー: LockID
型: 文字列
```

**入力欄**: 
- 左側: `LockID` （大文字小文字を**正確に**）
- 右側プルダウン: `文字列` を選択

⚠️ **超重要**: 
- キー名は**必ず** `LockID` （L, I, D が大文字）
- 型は**必ず** `文字列`

❌ **間違い例**: 
- `lockid` → NG
- `lock_id` → NG
- `LOCKID` → NG
- `LockId` → NG

✅ **正解**: `LockID` （大文字3つ）

#### ソートキー
```
□ ソートキーを追加  ← チェックしない
```

### STEP 4: テーブルの設定

#### テーブルクラス

そのまま（変更不要）
```
● DynamoDB Standard  ← これが選択されていればOK
```

#### 読み込み/書き込みキャパシティの設定 ⭐重要

```
キャパシティモード:
○ プロビジョニング済み
● オンデマンド  ← 必ず選択
```

💡 **理由**: 
- 使った分だけ課金（初期費用なし）
- 個人開発なら月額10円未満
- 自動スケーリング（管理不要）

### STEP 5: 暗号化

そのまま（変更不要）
```
暗号化: AWS所有のキー  ← デフォルトのまま
```

### STEP 6: タグ（オプション）

「タグ - オプション」セクション

タグを追加（推奨だが必須ではない）：

| キー | 値 |
|------|-----|
| `Project` | `recycle-system` |
| `Purpose` | `terraform-lock` |
| `ManagedBy` | `gui` |

### STEP 7: テーブルを作成

1. 画面を下までスクロール
2. 右下の「**テーブルの作成**」オレンジボタンをクリック
3. テーブルの作成には**約1分**かかります

### STEP 8: 作成完了を確認

テーブル一覧に戻ります。

```
テーブル名: terraform-state-lock
ステータス: アクティブ ✅
```

ステータスが「**アクティブ**」になればOK！

### STEP 9: 設定を確認

テーブル名「terraform-state-lock」をクリック：

#### 「概要」タブ
- ✅ テーブル名: `terraform-state-lock`
- ✅ パーティションキー: `LockID (S)` ← (S)は文字列の意味
- ✅ 読み取り/書き込みキャパシティモード: `オンデマンド`

すべてOKなら完了！ 🎉

---

## 🔗 PART 3: Terraformとの結びつけ方

さあ、いよいよTerraformと結びつけます！

### 確認: backend.tf の設定

`terraform/backend.tf` を開いて、以下の設定になっているか確認：

```hcl
terraform {
  backend "s3" {
    bucket = "recycle-system-terraform-state-kenpro"
    key    = "dev/terraform.tfstate"
    region = "us-east-1"
    dynamodb_table = "terraform-state-lock"
    encrypt = true
  }
}
```

⚠️ バケット名が作成したものと一致しているか確認！

### 方法1: 新規プロジェクト（stateがない場合）

```powershell
# terraformディレクトリに移動
cd terraform

# 初期化（S3とDynamoDBに接続）
terraform init

# 期待される出力:
# Initializing the backend...
# Successfully configured the backend "s3"!
# Terraform has been successfully initialized!
```

✅ これだけでOK！Terraformが自動的にS3とDynamoDBを使うようになります。

### 方法2: 既存プロジェクト（ローカルstateがある場合）

#### STEP 1: バックアップを作成

```powershell
cd terraform

# バックアップを作成
Copy-Item terraform.tfstate terraform.tfstate.backup-manual
```

#### STEP 2: stateを移行

```powershell
# S3バックエンドへ移行
terraform init -migrate-state
```

#### STEP 3: 対話的な確認

以下のメッセージが表示されます：

```
Initializing the backend...
Do you want to copy existing state to the new backend?
  Pre-existing state was found while migrating the previous "local" backend to the
  newly configured "s3" backend. No existing state was found in the newly
  configured "s3" backend. Do you want to copy this state to the new "s3"
  backend? Enter "yes" to copy and "no" to start with an empty state.

  Enter a value: 
```

👉 **`yes`** と入力してEnterキーを押す

#### STEP 4: 成功確認

```
Successfully configured the backend "s3"!
Terraform has been successfully initialized!
```

✅ 成功！

---

## ✅ PART 4: 動作確認

### 確認1: S3バケットにstateファイルが作成されたか

#### AWSコンソールで確認

1. S3コンソールを開く
2. バケット「recycle-system-terraform-state-kenpro」をクリック
3. `dev/` フォルダが表示される
4. `dev/` をクリック
5. `terraform.tfstate` が表示されればOK！

#### AWS CLIで確認

```powershell
aws s3 ls s3://recycle-system-terraform-state-kenpro/dev/

# 出力例:
# 2025-10-09 14:30:00      12345 terraform.tfstate
```

### 確認2: Terraformがstateを読めるか

```powershell
# 管理中のリソース一覧を表示
terraform state list

# 出力例:
# data.aws_caller_identity.current
# data.aws_region.current
# aws_dynamodb_table.tables["locations"]
# ...
```

### 確認3: planを実行（変更がないことを確認）

```powershell
terraform plan -var-file="environments/dev.tfvars"

# 期待される出力:
# No changes. Your infrastructure matches the configuration.
```

✅ すべて正常に動作しています！

---

## 🎯 完了チェックリスト

### S3バケット
- [ ] バケット名: `recycle-system-terraform-state-kenpro` で作成
- [ ] リージョン: `us-east-1`
- [ ] パブリックアクセス: すべてブロック ✅
- [ ] バージョニング: 有効 ✅
- [ ] 暗号化: 有効（SSE-S3） ✅

### DynamoDBテーブル
- [ ] テーブル名: `terraform-state-lock` で作成
- [ ] パーティションキー: `LockID` (文字列) ✅
- [ ] キャパシティモード: オンデマンド ✅
- [ ] ステータス: アクティブ ✅

### Terraform連携
- [ ] `backend.tf` のバケット名が一致 ✅
- [ ] `terraform init` が成功 ✅
- [ ] S3にstateファイルが作成された ✅
- [ ] `terraform state list` でリソースが表示される ✅

すべて☑なら完璧です！ 🎉

---

## 🔄 今後の使い方

### 日常的な使用

```powershell
# planを実行
terraform plan -var-file="environments/dev.tfvars"

# applyを実行
terraform apply -var-file="environments/dev.tfvars"

# stateを確認
terraform state list
```

**自動的にS3を使います！** 何も気にせず普通に使えます。

### S3のstateを確認したい場合

#### GUIで確認
1. S3コンソール → バケットを開く
2. `dev/terraform.tfstate` をクリック
3. 「オープン」または「ダウンロード」で内容を確認

#### CLIで確認
```powershell
# バケットの内容を確認
aws s3 ls s3://recycle-system-terraform-state-kenpro/dev/

# stateファイルをダウンロード
aws s3 cp s3://recycle-system-terraform-state-kenpro/dev/terraform.tfstate ./downloaded-state.json

# 内容を確認
Get-Content downloaded-state.json | ConvertFrom-Json
```

### バージョン履歴を確認

#### GUIで確認
1. S3コンソール → バケットを開く
2. `dev/terraform.tfstate` を選択
3. 上部の「バージョン」タブをクリック
4. 過去のバージョンが一覧表示される

#### CLIで確認
```powershell
# バージョン一覧を表示
aws s3api list-object-versions --bucket recycle-system-terraform-state-kenpro --prefix dev/terraform.tfstate
```

---

## 🆘 トラブルシューティング

### Q1: terraform init で「AccessDenied」エラー

**原因**: S3バケットまたはDynamoDBテーブルへのアクセス権限がない

**解決方法**:
```powershell
# 現在のAWSユーザーを確認
aws sts get-caller-identity

# IAMコンソールで権限を確認
# 必要な権限: s3:GetObject, s3:PutObject, s3:ListBucket
#           dynamodb:GetItem, dynamodb:PutItem, dynamodb:DeleteItem
```

### Q2: terraform init で「NoSuchBucket」エラー

**原因**: S3バケット名が間違っている

**解決方法**:
```powershell
# バケットが存在するか確認
aws s3 ls | Select-String "terraform-state"

# backend.tf のバケット名を修正
```

### Q3: terraform init で「ResourceNotFoundException」（DynamoDB）

**原因**: DynamoDBテーブル名が間違っている、またはテーブルが存在しない

**解決方法**:
```powershell
# テーブルが存在するか確認
aws dynamodb list-tables --region us-east-1

# backend.tf のテーブル名を確認（LockIDの大文字小文字も確認）
```

### Q4: 「Error acquiring the state lock」エラー

**原因**: 前回のterraform実行が異常終了し、ロックが残っている

**解決方法**:
```powershell
# ロックを強制解除（他の誰も実行していないことを確認）
terraform force-unlock <LOCK_ID>

# LOCK_IDはエラーメッセージに表示されます
```

### Q5: バケット名が既に使われている

**エラー**: `BucketAlreadyExists`

**解決方法**:
```
バケット名を変更:
recycle-system-terraform-state-kenpro-2025
recycle-system-terraform-state-kenpro-v2
```

`backend.tf` のバケット名も同じに変更してください。

---

## 📚 参考情報

### コスト見積もり

**S3**:
- ストレージ: ~1KB × バージョン数
- 月額: < 1円

**DynamoDB**:
- オンデマンドモード
- terraform実行時のみ課金
- 月額: < 10円

**合計**: 月額10円未満（個人開発の場合）

### セキュリティ

- ✅ S3バケット: パブリックアクセス完全ブロック
- ✅ S3バケット: AES-256暗号化
- ✅ S3バケット: バージョニング有効
- ✅ DynamoDB: AWS所有のキーで暗号化
- ✅ アクセス: IAMで制御

---

## 🎉 完了！

これで、TerraformのstateファイルがS3で安全に管理され、DynamoDBでロック制御されるようになりました！

### 達成したこと

✅ S3バケット作成（暗号化、バージョニング、パブリックアクセスブロック）
✅ DynamoDBテーブル作成（オンデマンド、ロック管理）
✅ Terraformとの連携完了
✅ stateファイルの安全な管理

### 今後の開発

普段通りにTerraformを使うだけです：
```powershell
terraform plan
terraform apply
```

すべて自動的にS3とDynamoDBを使います！

Happy Terraforming! 🚀

