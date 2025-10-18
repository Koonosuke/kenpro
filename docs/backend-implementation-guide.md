# バックエンド実装ガイド

本ドキュメントでは、リサイクルポイントシステムの現在のバックエンド実装、今後の展望、そして検討すべき代替アーキテクチャについて整理します。

## 現行アーキテクチャ

- **エントリーポイント**: Amazon API Gateway が `api-spec.yaml` で定義された REST エンドポイントを公開し、AWS Lambda を起動します。
- **コンピュート層**: Node.js 製 Lambda 関数を `backend/lambda/*` で管理。現時点では `backend/lambda/locations/index.js` が稼働しており、ロケーションデータ取得を担っています。
- **データ層**: DynamoDB テーブルは Terraform（`terraform/dynamodb.tf`）で PAY_PER_REQUEST 課金モードにて作成。`locations`、`qr_tokens`、`recycle_events`、`users`、`points_ledger`、`rewards` を用意済みです。
- **Infrastructure as Code**: Terraform 構成は `terraform/` ディレクトリに集約。S3 + DynamoDB を使ったリモートステート設定（`terraform/backend.tf`）、共通設定（`terraform/main.tf` や `terraform/variables.tf`）を通じて再利用性を確保しています。
- **CI/CD**: `.github/workflows/terraform.yml` で PR 時に Terraform plan を実行し、手動トリガーで apply/destroy をサポート。Lambda デプロイは現在、`backend/lambda/locations/README.md` 記載の ZIP + AWS CLI 手順で手動実施しています。

### Locations Lambda 詳細

`locations` Lambda はシンプルな REST ハンドラーを実装しており、以下をサポートします。

- `GET /locations`: すべてのロケーションを返却（`status` クエリでフィルタリング可能）。
- `GET /locations/{location_id}`: 指定 ID のロケーションを取得。
- CORS プレフライト対応と HTTP メソッド検証。
- `LOCATIONS_TABLE_NAME` 環境変数（デフォルト `recycle-system-dev-locations`）を用いた DynamoDB アクセス。`aws-sdk` の `DocumentClient` を利用しています。

ハンドラー実装は `backend/lambda/locations/index.js`、ランタイム依存関係は `backend/lambda/locations/package.json` を参照してください。

### データモデル概要

| テーブル | ハッシュキー | 目的 |
| --- | --- | --- |
| `locations` | `location_id` | リサイクルボックスとサイネージのメタデータ。 |
| `qr_tokens` | `token_id` | 生成済み QR トークンとライフサイクル管理。 |
| `recycle_events` | `event_id` | デバイス側のリサイクルイベント記録。 |
| `users` | `user_id` | 利用者アカウント情報とポイント残高。 |
| `points_ledger` | `transaction_id` | ポイント増減の監査トレイル。 |
| `rewards` | `reward_id` | 交換可能な特典カタログ。 |

機能追加に合わせて GSI を拡張可能です（例: 利用履歴参照用に `points_ledger` へ `user_id` GSI を付与）。

## 今後のロードマップ

- **Lambda の機能拡張**: QR トークン発行・検証、ポイント加算、管理系 API など `api-spec.yaml` に沿ったハンドラーを順次追加。
- **インフラ強化**: 関数ごとの最小権限 IAM ロール、Terraform の `enable_xray_tracing` フラグを用いた X-Ray 有効化、CloudWatch アラームや DLQ の導入により可観測性と堅牢性を向上。
- **データ最適化**: 必要に応じて GSI を設計（例: `locations` の `status` インデックス、`qr_tokens` の `user_id` GSI）、QR トークンやイベントの TTL 設定でコスト管理。
- **デプロイ自動化**: GitHub Actions や AWS CodePipeline を活用し、ソースから Lambda アーティファクトをバンドル・配信する CI パイプラインを構築。手動 ZIP デプロイを置き換える。
- **環境分離**: `terraform/environments/*.tfvars` を活用して dev/staging/production を標準化。用途に応じた AWS アカウント分離も検討。

## 代替アプローチ

- **コンテナベースサービス**: 重要な API を AWS Fargate（ECS）や EKS に移行し、ランタイム制御性・ローカル開発との整合性・常駐処理ニーズに対応。
- **GraphQL/AppSync バックエンド**: AppSync でデータモデルを GraphQL 化し、クライアント統合を簡素化。サイネージ更新にはサブスクリプションを活用し、Cognito と連携した認可を一元管理。
- **イベント駆動ワークフロー**: Step Functions や EventBridge Pipes で QR 生成、デバイステレメトリ、ポイント付与を編成し、結合度を下げつつ可視性を向上。
- **マネージドデータベース**: レポートや結合が必要な場合は Aurora Serverless / RDS を併用し、DynamoDB Streams や Lambda で同期させるハイブリッド構成を検討。
- **エッジ処理**: AWS IoT Rules や Lambda@Edge/CloudFront を活用し、サイネージ更新など低レイテンシ機能をデバイスやエッジ側で先行処理。

## 運用上の留意点

- **テスト**: Jest などで Lambda ハンドラーのユニットテストを整備し、DynamoDB Local と組み合わせた契約テストでクエリ挙動を検証。
- **設定管理**: 環境変数やシークレットは AWS Systems Manager Parameter Store / Secrets Manager に集約し、コード内のデフォルト値依存を軽減。
- **セキュリティ**: Lambda ごとの最小権限 IAM ポリシー、API Gateway usage plan、アクセスログ有効化など防御策を適用。

機能ごとの README と併せて本ガイドを活用し、バックエンド拡張時の認識統一とオンボーディング効率化を図ってください。
