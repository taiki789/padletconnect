This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Learn More

To learn more about Next.js, take a look at the following resources:


You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# まちかね祭 謎解き探検

まちかね祭の来場者向け謎解きWebサイトです。クイズ、Padlet投稿、スクリーンショット確認、景品引換までをスマートフォンで進められます。

## ローカル起動

1. PostgreSQLを用意します。Vercelへ公開する場合は、Vercel MarketplaceのNeonまたはSupabaseを利用できます。
2. `.env.example`を`.env`にコピーし、`DATABASE_URL`と各秘密値を設定します。
3. 初回だけDBスキーマを適用します。

```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

トップページは `http://localhost:3000` です。

## 環境変数

| 変数 | 用途 |
| --- | --- |
| `DATABASE_URL` | PostgreSQL接続URL |
| `ADMIN_SECRET_PATH` | 管理画面の秘密パス部分。例：`mckn-ops-random` |
| `ADMIN_PASSWORD` | 管理画面ログインパスワード |
| `STAFF_PASSCODE` | 参加者画面でスタッフが景品引換を確定するコード |
| `SESSION_SECRET` | 管理認証Cookie署名用のランダム文字列 |

管理画面は `/manage/<ADMIN_SECRET_PATH>` で開きます。`/admin` は存在しません。秘密パスは参加者向けコードへ含めず、漏洩時は環境変数を変更して再発行してください。

## 編集ポイント

- クイズ問題、選択肢、正答、解説、ランク：`src/data/quizzes.ts`
- スクリーンショット検証：`src/app/api/screenshot/route.ts`
- 永続データ構造：`prisma/schema.prisma`
- 参加者の途中状態：ブラウザの`localStorage`

スクリーンショットは形式と容量を検証した後、永続保存しません。景品配布はDBトランザクションで参加記録と在庫を更新します。

## 確認コマンド

```bash
npm run lint
npm run build
```

Vercelでは環境変数を設定し、ビルドコマンドに通常どおり `npm run build` を使用してください。
