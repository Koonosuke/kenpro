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

## 利用者目線でのシステムフロー

### 👤 利用者の具体的な体験

**田中さん（30代会社員）のリサイクル体験**

1. **出勤前の駅で**
   - スマホアプリで最寄りのリサイクルボックスを検索
   - 渋谷駅前のボックスが利用可能と表示

2. **リサイクルボックス到着**
   - ボックスに設置されたICカードリーダーにSuicaをタッチ
   - 「認証成功」の音と共にボックスが開錠

3. **ペットボトル投棄**
   - 空のペットボトルを投入
   - ボックスが自動で閉錠

4. **ポイント獲得**
   - サイネージにQRコードが20秒間表示
   - スマホアプリでQRコードをスキャン
   - 「10ポイント獲得！」の通知が表示

5. **ポイント活用**
   - アプリでポイント残高を確認（累計150ポイント）
   - コンビニの商品券（100ポイント）と交換
   - 残り50ポイントで次回も利用可能

### 🎯 利用者の体験フロー

```mermaid
flowchart TD
    A[利用者がリサイクルボックスに到着] --> B[ICカード/モバイルパスをタッチ]
    B --> C{認証成功？}
    C -->|成功| D[ボックスが開錠]
    C -->|失敗| E[エラーメッセージ表示]
    E --> B
    
    D --> F[ペットボトルを投入]
    F --> G[ボックスが閉錠]
    G --> H[重量センサーが検知]
    H --> I[サイネージにQRコードが表示]
    I --> J[スマホアプリでQRコードをスキャン]
    J --> K[ポイントが付与される]
    K --> L[ポイント残高を確認]
    L --> M[景品と交換可能]
    
    style A fill:#e1f5fe
    style K fill:#c8e6c9
    style M fill:#fff3e0
```

### 📱 利用者の操作画面フロー

```mermaid
flowchart LR
    subgraph "スマホアプリ画面"
        A1[マップ画面<br/>最寄りのリサイクルボックスを検索]
        A2[QRスキャン画面<br/>カメラでQRコードを読み取り]
        A3[ポイント付与完了画面<br/>獲得ポイントを表示]
        A4[マイページ<br/>ポイント残高・履歴確認]
        A5[景品交換画面<br/>ポイントで景品と交換]
    end
    
    A1 --> A2
    A2 --> A3
    A3 --> A4
    A4 --> A5
    A5 --> A1
    
    style A1 fill:#e3f2fd
    style A2 fill:#f3e5f5
    style A3 fill:#e8f5e8
    style A4 fill:#fff8e1
    style A5 fill:#fce4ec
```

### ⏱️ タイムラインでの利用体験

```mermaid
gantt
    title 利用者のリサイクル体験タイムライン
    dateFormat X
    axisFormat %s
    
    section 到着・認証
    リサイクルボックス到着    :0, 10
    ICカード認証            :10, 15
    ボックス開錠            :15, 20
    
    section 投棄
    ペットボトル投入        :20, 30
    ボックス閉錠            :30, 35
    重量検知                :35, 40
    
    section ポイント獲得
    QRコード表示            :40, 60
    QRスキャン              :60, 70
    ポイント付与            :70, 80
    
    section 確認・交換
    ポイント確認            :80, 90
    景品交換                :90, 120
```

### 💡 利用者にとってのメリット

| メリット | 説明 | 具体例 |
|----------|------|--------|
| **手軽なリサイクル** | 駅や街中で簡単にリサイクル可能 | 通勤途中で空きペットボトルを処分 |
| **ポイント還元** | リサイクルでポイント獲得 | 10回利用で100ポイント、商品券と交換 |
| **環境貢献** | リサイクル活動への参加 | 月10回利用で年間120本のペットボトルをリサイクル |
| **便利なアプリ** | 最寄りのボックス検索・ポイント管理 | マップで最寄りボックスを検索、履歴確認 |
| **即座のフィードバック** | QRスキャンで即座にポイント付与 | 投棄後すぐにポイント獲得を確認 |

### 🎯 システムの価値

**利用者視点**
- リサイクルが楽しく、継続しやすい
- ポイントで実用的な特典を獲得
- 環境活動への参加意識向上

**社会視点**
- 街中のリサイクル率向上
- ペットボトルの適正処理促進
- 持続可能な社会の実現

**事業者視点**
- リサイクルデータの収集・分析
- 利用者の行動パターン把握
- 効果的な環境施策の立案

## リサイクルシステム全体フロー（技術詳細）

```mermaid
sequenceDiagram
    participant User as User
    participant IC as IC_Card
    participant Box as RecycleBox
    participant Sensor as WeightSensor
    participant AWS as IoT_Core
    participant Lambda as Lambda
    participant Signage as Signage
    participant App as UserApp
    participant DB as DynamoDB

    User->>IC_Card: "1. ICカード/モバイルパスをタッチ"
    IC_Card->>RecycleBox: "2. 認証成功 ボックス開錠"
    User->>RecycleBox: "3. ペットボトルを投入"
    RecycleBox->>WeightSensor: "4. 重量変化を検知"
    WeightSensor->>IoT_Core: "5. MQTT送信: リサイクル成功"
    IoT_Core->>Lambda: "6. IoT Rule トリガー"
    Lambda->>DynamoDB: "7. QRトークン生成・保存"
    Lambda->>Signage: "8. QRコード表示"
    User->>UserApp: "9. QRコードをスキャン"
    UserApp->>Lambda: "10. QR検証・ポイント付与リクエスト"
    Lambda->>DynamoDB: "11. ポイント加算・トークン無効化"
    Lambda->>UserApp: "12. ポイント付与完了"
    UserApp->>User: "13. 景品交換可能"
```

## システム構成図

```mermaid
graph TD

subgraph "ユーザー側"
  U1["Next.js PWA<br/>ユーザーアプリ"]
  U2["QRスキャン / 残高 / 交換 / マップ表示"]
  U3["ICカード/モバイルパス"]
end

subgraph "サイネージ端末"
  D1["Raspberry Pi<br/>サイネージ表示端末"]
  D2["QR表示UI<br/>Next.js or Node.js"]
end

subgraph "リサイクルボックス"
  B1["ICカードリーダー<br/>NFC/非接触"]
  B2["開錠機構<br/>サーボモーター"]
  B3["重量センサー<br/>ロードセル or HX711"]
  B4["マイコン<br/>ESP32等"]
  B5["AWS IoT SDK<br/>MQTT Publish"]
  B1 --> B2
  B3 --> B4 --> B5
end

subgraph "AWSクラウド"
  A1["AWS IoT Core<br/>MQTTブローカー"]
  A2["IoT Rule<br/>トリガー"]
  A3["Lambda: recycle_handler<br/>QR発行・保存"]
  A4["API Gateway<br/>HTTP API"]
  A5["Lambda: qr_redeem<br/>署名検証・ポイント付与"]
  A6["DynamoDB<br/>users / qr_tokens / points_ledger / rewards / locations"]
  A7["Cognito<br/>認証 ユーザー/管理者"]
  A8["S3 + Athena<br/>監査ログ・集計分析"]
  A1 --> A2 --> A3
  A4 --> A5
  A3 --> A6
  A5 --> A6
  A5 --> A8
  A4 --> A7
end

subgraph "管理者"
  M1["Next.js 管理画面<br/>QR発行・利用統計"]
end

%% データフロー
U3 -->|"ICカード/モバイルパス認証"| B1
B1 -->|"認証成功"| B2
B3 -->|"重量変化検知"| B4
B5 -->|"MQTT publish<br/>/recycle/success"| A1
A3 -->|"生成されたQR情報"| D1
U1 -->|"QRスキャン→/qr/redeem"| A4
M1 -->|"QR発行API"| A4
A5 -->|"ポイント加算"| A6
U1 -->|"残高・交換情報取得"| A4
```

## 実装システム構成図（簡略版）

```mermaid
graph TD

subgraph "ユーザー側"
  U1["Next.js PWA<br/>ユーザーアプリ"]
  U2["QRスキャン / 残高 / 交換 / マップ表示"]
end

subgraph "リサイクルボックス（簡略版）"
  B1["重量センサー<br/>ロードセル or HX711"]
  B2["マイコン<br/>ESP32等"]
  B3["AWS IoT SDK<br/>MQTT Publish"]
  B1 --> B2 --> B3
end

subgraph "サイネージ端末"
  D1["Raspberry Pi<br/>サイネージ表示端末"]
  D2["QR表示UI<br/>Next.js"]
  D3["WebSocket接続<br/>リアルタイム更新"]
  D2 --> D3
end

subgraph "AWSクラウド"
  A1["AWS IoT Core<br/>MQTTブローカー"]
  A2["IoT Rule<br/>トリガー"]
  A3["Lambda: recycle_handler<br/>QR生成・保存"]
  A4["API Gateway<br/>HTTP API"]
  A5["Lambda: qr_redeem<br/>QR検証・ポイント付与"]
  A6["DynamoDB<br/>テーブル構成"]
  A7["Cognito<br/>ユーザー認証"]
  A8["S3 + Athena<br/>ログ・分析"]
  A9["WebSocket API<br/>サイネージ通信"]
  A1 --> A2 --> A3
  A4 --> A5
  A3 --> A6
  A5 --> A6
  A5 --> A8
  A4 --> A7
  A3 --> A9
end

subgraph "管理者"
  M1["Next.js 管理画面<br/>統計・設定管理"]
end

%% データフロー
B3 -->|"MQTT: /recycle/success"| A1
A3 -->|"WebSocket: QR表示"| D3
A3 -->|"QR保存"| A6
U1 -->|"QRスキャン→/qr/redeem"| A4
A5 -->|"ポイント加算"| A6
U1 -->|"残高・交換情報取得"| A4
M1 -->|"管理API"| A4
```

## データベース設計（DynamoDB）

| テーブル名 | 主キー | 属性 | 用途 |
|---|---|---|---|
| **users** | user_id (String) | email, name, points_balance, created_at, updated_at | ユーザー情報・ポイント残高 |
| **qr_tokens** | token_id (String) | user_id, location_id, points_value, expires_at, status, created_at | QRトークン管理 |
| **points_ledger** | transaction_id (String) | user_id, points_change, transaction_type, qr_token_id, created_at | ポイント取引履歴 |
| **rewards** | reward_id (String) | name, description, points_cost, stock_count, is_active, created_at | 景品マスタ |
| **locations** | location_id (String) | name, address, coordinates, is_active, created_at | リサイクルボックス設置場所 |
| **recycle_events** | event_id (String) | location_id, weight_detected, qr_token_id, created_at | リサイクルイベントログ |

## 実現技術詳細

### フロントエンド
- **Next.js 14**: App Router、Server Components
- **PWA**: Service Worker、オフライン対応
- **QRスキャン**: `@zxing/library`、カメラAPI
- **状態管理**: Zustand
- **UI**: Tailwind CSS + shadcn/ui

### バックエンド
- **API Gateway**: HTTP API v2、CORS設定
- **Lambda**: TypeScript、Node.js 18.x
- **認証**: Cognito User Pool、JWT
- **WebSocket**: API Gateway WebSocket API

### IoT・デバイス
- **ESP32**: Arduino IDE、WiFi接続
- **重量センサー**: HX711 + ロードセル
- **MQTT**: AWS IoT Device SDK
- **Raspberry Pi**: Node.js、WebSocket接続

### データベース
- **DynamoDB**: オンデマンド課金、GSI活用
- **S3**: ログ保存、静的ファイル
- **Athena**: ログ分析、SQLクエリ

### セキュリティ
- **暗号化**: AES-256、HTTPS/WSS
- **認証**: JWT、API Key
- **アクセス制御**: IAM Role、最小権限
