# Saisoku 引き継ぎメモ

最終更新: 2026-07-22

## プロダクト概要

Saisokuは、グランブルーファンタジーの団内運用を補助する身内向けWebツールである。
攻略サイトの代替ではなく、外部情報、団内実績、編成、目標、イベント、個人タスクを団内で使いやすい形に整理する。

全体方針の基準は `docs/01_overall_policy.md`。機能変更時は、全体方針に加えて対象機能の要件書を読むこと。

## 現在の到達点

- React + Express + Prismaによる単一リポジトリ構成
- Supabase PostgreSQLとPrisma migrationを利用
- Render Web Service向けの本番ビルド・静的配信に対応
- JWTをhttpOnly Cookieへ保存するログイン構成
- 主要な画面とAPIはログイン必須
- 編成、目標、イベントを相互に参照できる段階まで機能を拡張済み
- 必要素材・解放条件の進捗管理基盤を追加済み

公開URLとして `https://saisoku.onrender.com`、GitHubリポジトリとして `https://github.com/lipton34/saisoku` が記録されている。デプロイ状態そのものは、作業時にRender側で確認すること。

## 技術構成

- フロントエンド: Vite + React 18 + TypeScript + React Router
- バックエンド: Express + TypeScript
- DB: Supabase PostgreSQL
- ORM: Prisma 5
- 認証: username/password、bcrypt、JWT、httpOnly Cookie
- 画像保存: Supabase Storage
- UIアイコン: lucide-react
- デプロイ: Render Web Service
- パッケージ管理: npm

開発時はViteが `5173`、Expressが `4000` で起動し、Viteが `/api` をExpressへプロキシする。本番ではExpressがViteの `dist/` を配信する。

## 実装済み画面

- `/login`: ログイン、新規登録、招待コード入力
- `/`: ホーム、タスク集計、主要機能への導線
- `/tasks`: 日課・週課・単発タスク管理
- `/materials`: 素材目標、所持数、素材プリセット
- `/progress-goals`: 段階別の必要素材・条件・進捗管理
- `/goals`: 団内目標のカンバン、作成、提案、受信提案
- `/goals/:goalId`: 目標詳細、編集、関連リソース管理
- `/guild-war-goals`: 古戦場の貢献度、肉、日別目標、速度計算
- `/official-news`: 公式NEWS一覧、抽出結果、取得ログ
- `/event-schedule`: イベント開催情報、イベントメモ
- `/builds/search`: 編成一覧、検索、詳細
- `/builds/post`: 編成作成、プリセット反映
- `/builds/:sourceType/:buildId`: 投稿・プリセット詳細
- `/roadmap`: 機能ロードマップ

`/tools/:toolId` には旧プレースホルダー用のルートが残っている。

## 機能領域とAPI

すべて `/api` 配下。`/api/health` と認証操作以外の主要ルートは `requireAuth` を使用する。

- `/api/auth`: 登録、ログイン、ログアウト、現在ユーザー
- `/api/tasks`: タスクCRUD、完了、再開
- `/api/material-goals`: 素材目標、素材項目、プリセット
- `/api/progress-goals`: 進捗プリセット、所持数、条件、段階完了
- `/api/builds`: 編成投稿、プリセット、スクリーンショット
- `/api/build-masters`: GBFマスタと別名
- `/api/shared-goals`: 団内目標、提案、関連編成、必要武器、討伐目標、サブタスク
- `/api/guild-war-goals`: 現在の古戦場計画とボスマスタ
- `/api/news`, `/api/news-items`, `/api/source-articles`, `/api/news-fetch-logs`: 公式NEWS表示データ
- `/api/official-news`: 公式NEWS取得・再解析
- `/api/event-series`, `/api/event-occurrences`, `/api/event-notes`: イベント系列、開催回、メモ

フロント側のAPI型と呼び出しは `src/lib/api.ts` に集約されている。APIレスポンスを変更する場合は、サーバールートとフロント型を同時に更新する。

## 主なDB領域

`prisma/schema.prisma` に以下のモデル群がある。

- ユーザーとタスク
- 素材目標、素材項目、素材プリセット
- 段階式進捗目標、ユーザー所持数、共有条件値
- 編成投稿と編成画像
- 団内目標、目標提案、関連編成、必要武器、討伐目標、サブタスク
- キャラ・武器・召喚石・ジョブ等のGBFマスタと別名
- 古戦場計画、日別目標、ボス、周回速度
- 公式記事、抽出NEWS、取得ログ
- イベント系列、開催回、イベントメモ、参考リンク

スキーマ変更時は、Prisma schemaだけでなくmigrationを必ず追加する。本番適用は `npm run prisma:deploy` を使う。

## 編成と画像の運用

- 選択式のキャラ・武器・召喚石・ジョブ登録を基本として残す
- 候補外の名称は自由入力を許可する
- 1編成につきスクリーンショットは最大5枚
- 対応MIME typeはJPEG、PNG、WebP
- 1ファイル最大5MB
- 保存先は既定で公開bucket `gbf-build-screenshots`
- 一覧画面で大きな画像を大量表示しない
- 外部サイトの画像URLへ常時依存せず、自前管理する

Storage操作には `SUPABASE_URL` と `SUPABASE_SERVICE_ROLE_KEY` が必要。service role keyをフロントエンドへ渡してはいけない。

## 認証・公開範囲

- Cookie名は `saisoku_session`
- JWT有効期間は7日
- 本番Cookieは `secure`、`sameSite=lax`、`httpOnly`
- パスワードは8文字以上、bcrypt cost 12
- ユーザー名は小文字へ正規化し、3文字以上
- `INVITE_CODE` が設定されている場合だけ登録時に照合する

身内限定運用を守るため、本番では `INVITE_CODE` を必ず設定すること。認証や所有者判定を変更する作業は、影響と移行方法を先に整理する。

## 現在の重要事項

### 進捗管理

直近で `/progress-goals` の基盤が追加された。終末武器、十天衆、十賢者などのプリセット定義はあるが、必要素材・条件が未検証のため `isAvailable: false` になっている。

正確なゲーム内情報を確認し、要件・素材キー・共有所持数の扱いを固めるまで利用可能にしないこと。

### ドキュメントの新旧

`docs/` には初期要件、調査資料、後続フェーズの実装指示が混在する。番号だけで新旧を判断せず、現行コードとGit履歴も確認する。

- `docs/01_overall_policy.md`: 常に最初に読む全体方針
- `docs/18_拡張`: 編成画像、目標ボード、目標連結の段階計画
- `docs/19_build_screenshot_feature.md`: 編成画像Phase 1
- `docs/20_goal_board_feature.md`: 目標ボードPhase 2
- `docs/21_goal_links_feature.md`: 目標連結Phase 3
- `docs/22_修正.md`: `/goals` のカンバン中心UI
- `docs/23_progress_preset_feature.md`: 必要数の進捗・素材収集プリセット機能の正本
- `docs/preset.md`: 素材数、対象、出典の調査資料

### 技術的な注意

- `src/pages/GoalsPage.tsx`、`src/pages/BuildsPage.tsx`、`src/components/BuildFormSteps.tsx` は大きく、変更時の回帰範囲が広い
- `src/components/goals/GoalDetail.tsx` は現在 `GoalsPage.tsx` からの再エクスポートで、完全なコンポーネント分離ではない
- CSSは `src/styles.css` に集約され、複数フェーズの追記がある。新規スタイルは既存セレクタへの副作用を避ける
- 自動テストとlintスクリプトは未整備。現状は型検査、ビルド、手動確認が中心
- 公式NEWSは外部仕様変更の影響を受けるため、取得処理と表示処理を分けて扱う
- ワークツリーに未追跡の `.idea/` が存在する。ユーザー所有物として扱い、勝手に削除・追加しない

## UI・レスポンシブ方針

詳細な必須ルールは `AGENTS.md` に集約した。要点は以下。

- 新規・変更画面はデスクトップ、タブレット、スマートフォンで成立させる
- 対象幅の目安は360px、768px、1280px以上
- ページ全体の意図しない横スクロールは禁止
- 表、カンバン、固定スロットなど横幅が必要なUIだけ、領域内スクロールを許可する
- モバイルでフォーム、操作ボタン、カード情報が読めて操作できることを確認する
- 長い日本語、URL、ユーザー入力でレイアウトが壊れないようにする
- 既存の共通クラスを優先し、機能固有クラスには機能名のprefixを付ける

## ローカル開発と検証

```bash
npm install
npm run prisma:generate
npm run prisma:deploy
npm run dev
npm run typecheck
npm run build
```

UI変更時は主要導線に加え、360px、768px、デスクトップ幅で確認する。DBを変更しない作業で不要なmigrationを作らない。

## Render設定

```text
Build Command: npm install --include=dev && npm run prisma:generate && npm run build
Start Command: npm run start
Instance Type: Free
```

Renderでは `PORT` が自動設定される。Free instanceは無通信後にスリープするため、初回アクセスに待ち時間が発生する場合がある。

Supabaseへの接続にはSession pooler URLを使ってきた経緯がある。接続方式を変更する場合は、実行環境のIPv4/IPv6対応とPrismaの接続要件を確認する。

## 次に優先したいこと

1. 進捗プリセットの必要素材・条件を検証し、安全に利用可能化する
2. 主要画面のスマートフォン実機相当幅での回帰確認を継続する
3. 大型ページコンポーネントを、挙動を変えず段階的に分割する
4. APIと主要UIの自動テスト基盤を追加する
5. README、HANDOFF、機能要件を実装変更と同じ作業内で更新する

## 引き継ぎ時の確認順

1. `AGENTS.md`
2. `docs/01_overall_policy.md`
3. 対象機能の `docs/*`
4. `README.md` と本ファイル
5. `git status` と直近のGit履歴
6. 対象画面、APIルート、Prisma schema

環境変数の実値は読まず、`.env.example` とコード上の参照だけで確認すること。
