# Saisoku 引き継ぎメモ

## 現在の到達点

- グランブルーファンタジー向けのお役立ちツール `Saisoku` の初期版を構築済み。
- 公開URL: https://saisoku.onrender.com
- 身内ユーザーが公開URLへアクセスできることを確認済み。
- 新規登録、ログイン、タスク登録、確認、完了、未完了戻し、削除の基本動作を実装済み。
- Supabase PostgreSQL への接続と Prisma migration は完了済み。
- GitHub リポジトリ: `https://github.com/lipton34/saisoku`
- Render Free にデプロイ済み。

## 技術構成

- フロントエンド: Vite + React + TypeScript
- バックエンド: Express + TypeScript
- DB: Supabase PostgreSQL
- ORM: Prisma
- 認証: ユーザー名 + パスワード、bcrypt hash、httpOnly cookie + JWT
- デプロイ: Render Web Service
- パッケージ管理: npm

## ローカル開発

作業ディレクトリ:

```bash
C:\project\saisoku
```

主なコマンド:

```bash
npm install
npm run dev
npm run typecheck
npm run build
npm run prisma:migrate -- --name <migration_name>
npm run prisma:deploy
```

ローカルURL:

```text
http://localhost:5173
```

API:

```text
http://localhost:4000/api
```

## 環境変数

`.env` はGit管理しない。

必要な変数:

```env
DATABASE_URL=Supabase Session pooler URL
JWT_SECRET=長いランダム文字列
PORT=4000
CLIENT_ORIGIN=http://localhost:5173
```

Render側の環境変数:

```env
DATABASE_URL=Supabase Session pooler URL
JWT_SECRET=本番用の長いランダム文字列
NODE_ENV=production
```

Renderでは `PORT` は自動設定されるため不要。

## Render 設定

Build Command:

```bash
npm install --include=dev && npm run prisma:generate && npm run build
```

Start Command:

```bash
npm run start
```

Instance Type:

```text
Free
```

Render Free は無通信が続くとスリープする。初回アクセス時に起動待ちが発生することがある。

## 実装済み画面

- `LoginPage`
  - ログイン
  - 新規登録
- `HomePage`
  - 未完了数
  - 日課残り
  - 週課残り
  - 完了済み数
  - 優先タスク
  - 最近の完了
  - 各機能への導線
- `TasksPage`
  - タスク登録
  - タスク一覧
  - 未完了/全部/完了フィルタ
  - 完了、未完了戻し、削除
- `ToolPlaceholderPage`
  - 素材メモ
  - 編成メモ
  - イベント進捗
  - マルチ救援メモ

## API

認証:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

タスク:

```text
GET    /api/tasks
POST   /api/tasks
PATCH  /api/tasks/:id
DELETE /api/tasks/:id
POST   /api/tasks/:id/complete
POST   /api/tasks/:id/reopen
```

ヘルスチェック:

```text
GET /api/health
```

## DBモデル

Prisma schema:

- `User`
  - `id`
  - `username`
  - `passwordHash`
  - `displayName`
  - `createdAt`
  - `updatedAt`
- `Task`
  - `id`
  - `title`
  - `description`
  - `category`
  - `repeatType`: `daily | weekly | once`
  - `dueDate`
  - `resetHourJst`
  - `isCompleted`
  - `completedAt`
  - `ownerId`
  - `createdAt`
  - `updatedAt`

## 重要な経緯

- 最初は `C:\project` 全体がGitリポジトリになっていた。
- そのままpushするとUnityプロジェクトの巨大ファイルが入り、GitHubの100MB制限で失敗した。
- 現在は `C:\project\saisoku` を独立したGitリポジトリとして作り直し、GitHub `lipton34/saisoku` にpush済み。
- `.env` は `.gitignore` 対象で、秘密情報はGitHubに含まれていない。
- Supabase direct connection はIPv6到達不可だったため、Session pooler URLを使用している。
- RenderのBuild Commandは `npm install --include=dev` が必要。`@types/...` がdevDependenciesのため。

## 次の推奨作業

優先度高:

- 新規登録を招待コード制にする。
- 身内以外がアカウント作成できないようにする。
- Render本番ログで登録/タスク保存エラーがないか確認する。

機能拡張候補:

- 日課テンプレート一括追加
- 毎朝5時リセットに合わせた日課の自動未完了化
- 週課リセット
- カテゴリ別タスク表示
- 素材メモ機能
- イベント進捗管理
- 編成メモ
- マルチ救援メモ

## 次チャット開始用プロンプト

```text
Saisokuというグラブル向け身内用Webツールを開発中です。
技術構成は Vite + React + TypeScript、Express + TypeScript、Prisma、Supabase PostgreSQL、Render Free です。
公開URLは https://saisoku.onrender.com で、GitHubは https://github.com/lipton34/saisoku です。
ローカル作業ディレクトリは C:\project\saisoku です。
現在は新規登録、ログイン、タスク登録/確認/完了/未完了戻し/削除、ホーム画面、各機能プレースホルダーまで実装済みです。
SupabaseはSession pooler URLをDATABASE_URLに使っています。
RenderのBuild Commandは npm install --include=dev && npm run prisma:generate && npm run build、Start Commandは npm run start です。
次は機能拡張フェーズです。まずはこのHANDOFF.mdの内容を前提に、既存コードを確認してから作業してください。
```
