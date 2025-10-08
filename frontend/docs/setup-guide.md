# Next.js + Biome セットアップガイド

## 概要

リサイクルポイントシステムのフロントエンド開発環境のセットアップ手順です。
Next.js 14.2.5 + TypeScript + Tailwind CSS + Biome を使用します。

## 前提条件

- Node.js 18.0.0以上
- npm または yarn
- Git

## セットアップ手順

### 1. Next.jsプロジェクト初期化

```bash
# プロジェクトルートで実行
npx create-next-app@14.2.5 frontend --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
```

**オプション説明:**
- `@14.2.5`: 安定版LTSを使用
- `--typescript`: TypeScript対応
- `--tailwind`: Tailwind CSS統合
- `--eslint`: ESLint初期設定（後でBiomeに移行）
- `--app`: App Router使用
- `--src-dir`: src/ディレクトリ構成
- `--import-alias "@/*"`: インポートエイリアス設定
- `--yes`: 全オプション自動承認

### 2. Biomeインストール

```bash
cd frontend
npm install --save-dev @biomejs/biome
```

### 3. Biome設定ファイル作成

```bash
npx @biomejs/biome init
```

### 4. biome.json設定

```json
{
  "$schema": "https://biomejs.dev/schemas/2.2.5/schema.json",
  "vcs": {
    "enabled": false,
    "clientKind": "git",
    "useIgnoreFile": false
  },
  "files": {
    "ignoreUnknown": false,
    "includes": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx"],
    "experimentalScannerIgnores": [
      "node_modules/**",
      ".next/**",
      "dist/**",
      "build/**",
      "*.min.js"
    ]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noNonNullAssertion": "warn"
      },
      "suspicious": {
        "noExplicitAny": "warn"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "trailingCommas": "es5",
      "semicolons": "always",
      "arrowParentheses": "always",
      "bracketSpacing": true,
      "bracketSameLine": false
    }
  },
  "assist": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

### 5. package.jsonスクリプト更新

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "biome lint .",
    "lint:fix": "biome lint --write .",
    "format": "biome format .",
    "format:fix": "biome format --write .",
    "check": "biome check .",
    "check:fix": "biome check --write ."
  }
}
```

### 6. ESLint設定の無効化

```bash
# ESLint設定をバックアップ
mv .eslintrc.json .eslintrc.json.bak
```

### 7. コードフォーマット・リント実行

```bash
# 全ファイルのフォーマット・リント実行
npm run check:fix
```

### 8. 開発サーバー起動確認

```bash
npm run dev
```

ブラウザで `http://localhost:3000` にアクセスして動作確認。

## 利用可能なコマンド

### 開発
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

## プロジェクト構成

```
frontend/
├── src/
│   ├── app/                 # App Router
│   │   ├── globals.css     # グローバルスタイル
│   │   ├── layout.tsx      # ルートレイアウト
│   │   └── page.tsx        # ホームページ
│   ├── components/         # 再利用可能コンポーネント
│   └── lib/               # ユーティリティ関数
├── public/                # 静的ファイル
├── biome.json            # Biome設定
├── package.json          # 依存関係・スクリプト
├── tailwind.config.ts    # Tailwind設定
├── tsconfig.json         # TypeScript設定
└── next.config.mjs       # Next.js設定
```

## VS Code設定（推奨）

### 拡張機能
- **Biome** - 公式Biome拡張機能
- **Tailwind CSS IntelliSense** - Tailwind CSS支援
- **TypeScript Importer** - TypeScript自動インポート

### .vscode/settings.json
```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

## トラブルシューティング

### よくある問題

#### 1. BiomeがTailwind CSSの@tailwindディレクティブをエラーにする
**解決方法:** CSSのlinter設定を削除（biome.jsonから`css.linter`セクションを削除）

#### 2. ESLintとBiomeが競合する
**解決方法:** ESLint設定ファイルをバックアップして無効化

#### 3. フォーマットが適用されない
**解決方法:** 
```bash
npm run check:fix
```

#### 4. 開発サーバーが起動しない
**解決方法:**
```bash
# 依存関係再インストール
rm -rf node_modules package-lock.json
npm install
npm run dev
```

## 次のステップ

1. **コンポーネント設計** - UIコンポーネントの作成
2. **API統合** - バックエンドAPIとの連携
3. **状態管理** - ZustandまたはReact Queryの導入
4. **PWA設定** - プログレッシブWebアプリ化
5. **テスト設定** - Jest + Testing Libraryの導入

## 参考リンク

- [Next.js Documentation](https://nextjs.org/docs)
- [Biome Documentation](https://biomejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)
