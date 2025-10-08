# フロントエンド開発ドキュメント

## 📚 ドキュメント一覧

### セットアップ・開発環境
- [セットアップガイド](./setup-guide.md) - Next.js + Biome の初期セットアップ手順
- [アーキテクチャ設計](./architecture.md) - フロントエンドアーキテクチャの詳細設計

### 開発ガイドライン
- [コーディング規約](./coding-standards.md) - TypeScript、React、Tailwind CSS のコーディング規約
- [コンポーネント設計](./component-design.md) - 再利用可能コンポーネントの設計指針
- [API統合](./api-integration.md) - バックエンドAPIとの統合方法

### 機能実装
- [認証システム](./auth-system.md) - AWS Cognito を使った認証実装
- [マップ機能](./map-features.md) - 位置情報表示・選択機能
- [QRコード機能](./qr-features.md) - QRスキャン・表示機能
- [PWA実装](./pwa-implementation.md) - プログレッシブWebアプリ化

### デプロイ・運用
- [デプロイガイド](./deployment.md) - 本番環境へのデプロイ手順
- [パフォーマンス最適化](./performance.md) - パフォーマンス改善手法
- [トラブルシューティング](./troubleshooting.md) - よくある問題と解決方法

## 🚀 クイックスタート

### 1. 環境セットアップ
```bash
# プロジェクトルートで実行
npx create-next-app@14.2.5 frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes

# フロントエンドディレクトリに移動
cd frontend

# Biomeインストール
npm install --save-dev @biomejs/biome

# 設定ファイル作成
npx @biomejs/biome init
```

### 2. 開発サーバー起動
```bash
npm run dev
```

### 3. ブラウザで確認
`http://localhost:3000` にアクセス

## 📋 開発ワークフロー

### 1. 機能開発
1. ブランチ作成
2. 機能実装
3. コード品質チェック
4. テスト作成
5. プルリクエスト作成

### 2. コード品質チェック
```bash
# フォーマット・リント・インポート整理
npm run check:fix

# 型チェック
npm run build
```

### 3. テスト実行
```bash
# 単体テスト
npm run test

# E2Eテスト
npm run test:e2e
```

## 🛠️ 利用技術

### コア技術
- **Next.js 14.2.5** - Reactフレームワーク
- **TypeScript** - 型安全性
- **Tailwind CSS** - ユーティリティファーストCSS
- **Biome** - Linter + Formatter

### 状態管理
- **React Query** - サーバー状態管理
- **Zustand** - クライアント状態管理

### UI・UX
- **html5-qrcode** - QRコードスキャン
- **Leaflet** - マップ表示
- **PWA** - プログレッシブWebアプリ

## 📁 プロジェクト構成

```
frontend/
├── src/
│   ├── app/                 # App Router
│   ├── components/          # 再利用可能コンポーネント
│   ├── lib/                # ユーティリティ
│   ├── hooks/              # カスタムフック
│   ├── stores/             # Zustandストア
│   └── types/              # TypeScript型定義
├── docs/                   # ドキュメント
├── public/                 # 静的ファイル
└── 設定ファイル
```

## 🔧 開発コマンド

### 基本コマンド
```bash
npm run dev          # 開発サーバー起動
npm run build        # 本番ビルド
npm run start        # 本番サーバー起動
```

### コード品質
```bash
npm run check        # フォーマット・リント・インポート整理チェック
npm run check:fix    # 上記を自動修正
npm run lint         # リントのみチェック
npm run lint:fix     # リント自動修正
npm run format       # フォーマットのみチェック
npm run format:fix   # フォーマット自動修正
```

### テスト
```bash
npm run test         # 単体テスト実行
npm run test:watch   # ウォッチモード
npm run test:coverage # カバレッジ付きテスト
npm run test:e2e     # E2Eテスト実行
```

## 📖 参考資料

### 公式ドキュメント
- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Biome Documentation](https://biomejs.dev/)

### 学習リソース
- [Next.js Learn Course](https://nextjs.org/learn)
- [React Query Documentation](https://tanstack.com/query/latest)
- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [PWA Documentation](https://web.dev/progressive-web-apps/)

## 🤝 コントリビューション

### 開発参加方法
1. リポジトリをフォーク
2. 機能ブランチを作成
3. 変更をコミット
4. プルリクエストを作成

### コーディング規約
- TypeScript の型安全性を重視
- Biome の設定に従う
- コンポーネントは再利用可能に設計
- テストを必ず作成

### コミットメッセージ
```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードスタイル修正
refactor: リファクタリング
test: テスト追加・修正
chore: ビルド・設定変更
```

## 📞 サポート

### 問題報告
- GitHub Issues で問題を報告
- 再現手順を詳細に記載
- エラーメッセージを添付

### 質問・相談
- 開発チームに直接連絡
- ドキュメントを確認
- コミュニティフォーラムを利用

---

**最終更新:** 2024年10月8日  
**バージョン:** 1.0.0
