# School-Festival-2
Created with CodeSandbox
# 推奨環境 / セットアップガイド

このプロジェクトを他の環境（開発者のローカルマシンや CI / サーバー）で確実にビルド・実行するための推奨環境と手順をまとめます。

---

## 推奨ソフトウェア
- Node.js: 推奨バージョン `>=18`（LTS）。プロジェクトで固定するなら `.nvmrc` にバージョンを入れて下さい（例: `18`）。
- npm: Node に付属する npm（`npm -v` を確認）。CI では `npm ci` を使うことを推奨します。
- Git: 最新の安定版

例: バージョン確認
```bash
node -v
npm -v
```

---

## ロックファイル
- `package-lock.json` をコミットしてください。CI / 他の開発者は `npm ci` を使ってロックファイル通りにインストールすることを推奨します。

---

## ローカルセットアップ（初回）
リポジトリをクローンし、依存をインストール・起動する手順:

```bash
git clone <repo-url>
cd <repo-dir>

# 推奨: Node のバージョンをプロジェクトに合わせる（nvm 利用例）
# nvm install
# nvm use

# 依存を正確に再現してインストール（package-lock.json がある場合）
npm ci

# 開発サーバーを起動
npm start

# 本番向けビルド
npm run build
```

注意:
- ロックファイルが存在しない場合は `npm install` を使い、その後 `package-lock.json` をコミットしてください。
- `npm ci` は厳密に `package-lock.json` に従って再現性の高いインストールを行います。

---

## 環境変数（.env）
ビルド / 実行に必要な環境変数がある場合は以下のように `.env` / `.env.local` / `.env.production` を使って設定してください。環境変数名はプロジェクトの構成に合わせてください（以下は例）:

```text
# 例
REACT_APP_API_BASE_URL=https://api.example.com
REACT_APP_SQUARE_ENV=PRODUCTION
REACT_APP_SQUARE_APP_ID=your_square_app_id
REACT_APP_SQUARE_LOCATION_ID=your_location_id
```

※ secrets / API キーは公開リポジトリに含めないでください。CI には環境変数として設定してください。

---

## よくあるビルド問題と対処法

- 依存の不整合 / 再現できないインストール  
  → lockfile（package-lock.json）がある場合は `npm ci` を使ってください。ローカルで依存を更新したら `npm install` 後、`package-lock.json` をコミットしてください。

- Node / npm のバージョン差による問題  
  → `.nvmrc` や README に推奨 Node バージョンを記載し、各開発者が合わせるよう案内してください。CI でも同じ Node バージョンを使うこと。

- ESLint のプラグインエラー（例: "Definition for rule 'react-hooks/exhaustive-deps' was not found" や "Plugin 'react-hooks' was conflicted"）  
  - 一時回避:
    ```bash
    # 開発中のみオーバーレイを無効化する（推奨は一時的回避のみ）
    DISABLE_ESLINT_PLUGIN=true npm start
    ```
  - 根本対処:
    - 依存関係を正しくインストール（例: react-scripts のバージョンに合わせた `eslint-plugin-react-hooks` を入れる）
      ```bash
      npm install --save-dev eslint-plugin-react-hooks@4.6.2
      ```
    - あるいはトップレベルの不要な `eslint-plugin-react-hooks` をアンインストールして CRA の内蔵設定を使う:
      ```bash
      npm uninstall --save-dev eslint-plugin-react-hooks
      ```
  - CI / サーバーでエラー発生時はログを保存して、どのプラグインが原因か確認してください。

- ネイティブビルド失敗（node-gyp 関連）  
  - サーバー（Linux）では以下が必要になることがあります：
    ```bash
    # Debian/Ubuntu 系の例
    sudo apt-get update
    sudo apt-get install -y build-essential python3
    ```
  - エラーメッセージに従って不足パッケージをインストールしてください。

- 大文字小文字（case-sensitive）によるファイル参照エラー（mac は通るが Linux で失敗する）  
  - import パスの大文字小文字を厳密に一致させてください（例: `import logo from './image/logo.jpg'` と filesystem の名前を一致）。

---

## CI（GitHub Actions）サンプル
簡易的なワークフロー（`.github/workflows/ci.yml`）:

```yaml
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [18.x]
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
      - run: npm ci
      - run: npm run build
```

---

## Docker を使ったビルド例（オプション）
簡易的な `Dockerfile`:

```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

---

## まとめ（チェックリスト）
- [ ] Node バージョンを README/.nvmrc に明記
- [ ] package-lock.json をコミット
- [ ] CI で `npm ci && npm run build` を実行
- [ ] 必要な環境変数を `.env` にまとめ（公開しない）
- [ ] OS 間の大文字小文字差に注意（画像や import パス）

---

必要ならこの README セクションを既存の README に統合するパッチ（diff）を作成しますし、`.nvmrc` / GitHub Actions ワークフロー / Dockerfile も実際にファイルとして生成して差分を提供できます。どれを作りましょうか？
