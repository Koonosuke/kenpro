# システム概要と役割

## アーキテクチャ層別構成

| 層 | コンポーネント | 主な機能 |
|---|---|---|
| デバイス層 | 重量センサー + マイコン (ESP32) | 投棄検知 → IoT CoreへMQTT送信 |
| 表示層 | サイネージ端末 (Raspberry Pi) | Lambdaから受け取ったQRを表示 |
| フロントエンド | Next.js (PWA) | QRスキャン、残高確認、ポイント交換、マップ表示 |
| バックエンド | API Gateway + Lambda (TypeScript) | QR発行・検証、ポイント加算、トランザクション処理 |
| データ層 | DynamoDB | users / qr_tokens / points_ledger / rewards / locations |
| 認証層 | Cognito | ユーザー認証・セッション管理 |
| メッセージ層 | AWS IoT Core | センサーイベントのMQTT通信 |
| 監査/分析 | S3 + Athena | イベントログ保管とクエリ分析 |

## システム構成図

```mermaid
graph TD

subgraph ユーザー側
  U1[Next.js PWA<br>ユーザーアプリ]
  U2[QRスキャン / 残高 / 交換 / マップ表示]
end

subgraph サイネージ端末
  D1[Raspberry Pi<br>サイネージ表示端末]
  D2[QR表示UI (Next.js or Node.js)]
end

subgraph ゴミ箱デバイス
  S1[重量センサー<br>ロードセル or HX711]
  S2[マイコン (ESP32等)]
  S3[AWS IoT SDK<br>MQTT Publish]
  S1 --> S2 --> S3
end

subgraph AWSクラウド
  A1[AWS IoT Core<br>MQTTブローカー]
  A2[IoT Rule<br>トリガー]
  A3[Lambda: recycle_handler<br>QR発行・保存]
  A4[API Gateway (HTTP API)<br>API公開層]
  A5[Lambda: qr_redeem<br>署名検証・ポイント付与]
  A6[DynamoDB<br>users / qr_tokens / points_ledger / rewards_* / locations]
  A7[Cognito<br>認証（ユーザー/管理者）]
  A8[S3 + Athena<br>監査ログ・集計分析]
  A1 --> A2 --> A3
  A4 --> A5
  A3 --> A6
  A5 --> A6
  A5 --> A8
  A4 --> A7
end

subgraph 管理者
  M1[Next.js 管理画面<br>QR発行・利用統計]
end

%% データフロー
S3 -->|MQTT publish<br>/recycle/success| A1
A3 -->|生成されたQR情報| D1
U1 -->|QRスキャン→/qr/redeem| A4
M1 -->|QR発行API| A4
A5 -->|ポイント加算| A6
U1 -->|残高・交換情報取得| A4
