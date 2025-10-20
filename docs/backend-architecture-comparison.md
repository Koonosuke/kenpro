# AWS バックエンドアーキテクチャ設計メモ

本メモでは、現在のリサイクルポイントシステム（以下「本システム」）におけるバックエンド構成を整理したうえで、AWS で一般的に採用される別アプローチとベストプラクティスを比較します。現状把握と将来の拡張検討の双方に役立つことを狙いとしています。

## 1. 現行バックエンド構成

| レイヤ | 採用技術 | 主な役割 / 特徴 |
| --- | --- | --- |
| エントリーポイント | Amazon API Gateway (REST API) | Lambda との AWS Proxy 統合。`/locations` / `/rewards` / `/rewards/{id}/exchange` 等のルーティングを提供。ステージ `dev` を terraform で一括デプロイ。 |
| アプリケーション | AWS Lambda (Node.js 18) | `lambda/locations` と `lambda/rewards` を実装。DocumentClient を用いて DynamoDB にアクセス。交換処理は `TransactWrite` で `users` / `rewards` / `points_ledger` を同時更新。 |
| データ | Amazon DynamoDB | テーブル: `locations`, `qr_tokens`, `recycle_events`, `users`, `points_ledger`, `rewards`。現状はオンデマンド課金・GSI 最小構成。 |
| インフラ管理 | Terraform | DynamoDB・Lambda・API Gateway を IaC 管理。`archive_file` で Lambda ZIP を自動生成。S3 + DynamoDB によるリモートステート。 |
| ドキュメント / CI | GitHub Actions (Terraform Plan) | Plan を PR にコメント。Apply/Destroy は手動トリガ。Lambda のデプロイは現状手動 ZIP + CLI。 |

### 強み
- **サーバーレスで低運用コスト**: IAM ロールと DynamoDB の運用のみで済む。トラフィックスケールへの耐性も高い。
- **取引一貫性**: `TransactWrite` によりポイント残高と景品在庫の整合性を確保。
- **IaC による再現性**: Terraform が API Gateway/Lambda/DynamoDB を一括管理するため、環境の再構築が容易。

### 現時点の留意点
- **Lambda のビルド/デプロイ**: Terraform とは別に `npm install` → `zip` → `update-function-code` が必要。CI に取り込む余地あり。
- **認可レイヤ**: API Gateway の Authorizer をまだ組み込んでいないため、本番運用時は Cognito/JWT 導入が必須。
- **監視/ロギング**: CloudWatch Logs 頼り。X-Ray や Structured Logging を導入するとトラブルシュートが容易になる。

## 2. 代替アーキテクチャ & ベストプラクティス比較

| アプローチ | 概要 | 採用メリット | 注意点 |
| --- | --- | --- | --- |
| **Lambda + API Gateway (現行)** | フルサーバーレス構成。小〜中規模ワークロード向け。 | イベント駆動と相性、課金が従量制、Terraform で細かく制御可能。 | コールドスタート、複雑なバッチ/job には不向き。 |
| **AWS AppSync (GraphQL)** | GraphQL API をマネージドで提供。DynamoDB 連携が容易。 | クライアントが必要なフィールドのみ取得。リアルタイム更新（Subscriptions）と相性良い。 | GraphQL の学習コスト。既存 REST クライアントからの移行設計。 |
| **Amazon API Gateway HTTP API + Lambda** | REST API よりもレスポンスが軽量。WebSocket/HTTP の選択肢。 | コストが REST API より低い。設定がシンプル。 | 機能セットが限定的（カスタムオーソライザ周りは対応済みだが REST より柔軟性が少ない）。 |
| **AWS Fargate (ECS)** | コンテナで Node.js/Go などを常駐運用。 | 常時稼働が必要、ステートフルな処理、長時間ジョブに強い。 | インフラ管理（ALB、VPC、AutoScaling）のコストが増す。同時接続上限やメンテナンスが必要。 |
| **AWS Step Functions + Lambda** | 業務フローをワークフローとして定義。 | エラー処理・リトライを自動化。交換フローに承認ステップがある場合に有効。 | 設計が複雑化しやすい。ドキュメント化・モニタリング設計が重要。 |
| **Amazon Aurora Serverless** | RDB の機能が必要な場合。ポイント履歴を SQL で分析。 | SQL クエリ/トランザクションの柔軟性。BI ツールとの親和性。 | 最低コストが DynamoDB より高い。スケーリング特性を理解する必要。 |
| **EventBridge + Lambda** | イベント駆動をさらに拡張。外部サービスからもイベント受信。 | トピックベースに処理を分離し、疎結合にできる。 | 設計が散逸する可能性。ドキュメント化と監査ログが重要。 |

### ベストプラクティスハイライト

- **権限設計**: Lambdaごとの IAM 最小権限 (least privilege) を徹底。読み取り専用と書き込み可能を分ける。
- **環境管理**: Terraform では `var.environment` をキーにステージング/本番を分離。AWS アカウントを分けるとさらに安全。
- **CI/CD**: GitHub Actions や CodePipeline で `npm ci` → `zip` → `terraform plan` → `apply` → `aws lambda update-function-code` を自動化。
- **監視/アラート**: CloudWatch Metrics (Concurrency, Throttles), DynamoDB の Consumed Capacity をモニタリング。Lambda エラーが一定数発生したら SNS/Slack 通知。
- **セキュリティ**: API Gateway に WAF、Cognito Authorizer、Usage Plan/ API Key を設定。DynamoDB の PITR (Point-in-Time Recovery) を有効化。
- **ローカル開発**: DynamoDB Local や AWS SAM CLI を使い、モックではなく実際のテーブルスキーマでテスト。

## 3. 本システムにおける進化候補

| 項目 | 現状 | 次ステップ案 |
| --- | --- | --- |
| 認証・認可 | API Gateway に `authorization = "NONE"` を設定 | Amazon Cognito + JWT オーソライザ。Lambda 内で `sub` を検証。 |
| 交換履歴検索 | `points_ledger` への `scan` | GSI (`user_id`, `reward_id`) の追加 or Athena/S3 へレプリケーション。 |
| CI/CD | すべて手動 | GitHub Actions で lint/test/deploy。`sam build` や `terraform apply` を pipeline に統合。 |
| 監査ログ | CloudWatch Logs のみ | DynamoDB Streams + Kinesis Firehose で S3/Athena にアーカイブ。 |
| 多言語対応 | API/フロントを別リポジトリ | Monorepo 管理 + Turborepo や NX でデプロイ分割を高速化。 |

## 4. サマリー

- 現行の Lambda + API Gateway + DynamoDB 構成は、初期コストと運用負荷が低く、ポイント交換のようなイベント駆動型ビジネスロジックに適しています。
- 規模拡大や機能要件の変化に応じて、GraphQL (AppSync) やコンテナ (Fargate)、ワークフロー (Step Functions) といった代替手段を検討可能。
- ベストプラクティスとして、IAM 最小権限・CI/CD 自動化・監視/アラートの整備・セキュリティ強化を継続的に行うことで、信頼性の高いバックエンド運用が実現できます。
