このアプリケーションは今年度の学祭に向けver.2.0.への大幅なリファクタリングを実施しています。去年のプロダクトのコードをご覧になりたい方は、「old-ver-2026」ブランチをご覧ください。
アプリのデモ版：https://melting-sugar.github.io/School-Festival-2_ForExhibition/
アプリの全体像について解説している動画：https://youtu.be/9oQvhiEaNYs

# School-Festival-2

客側モバイルオーダーのフロントエンドです。ユーザーはこのアプリを通じて、商品選択、予約時刻の指定、決済(PaySys経由のクレジットカード/PayPay)、注文内容と番号札の確認を行います。

バックエンドと店舗側フロントエンドは別リポジトリ(`Shrssss/CDMTs-payment-application`)で管理されています。

**ver2.0で何が変わったかの詳細は [docs/ver2.0-changes.md](./docs/ver2.0-changes.md) にまとめています**(技術に詳しくない方向けの平易な説明つき)。

## ⚠️⚠️⚠️ モックスイッチについて(本番公開前に必ず確認すること)

このアプリには3つのモックスイッチがあります。**本番環境では、以下を全て `false` にしてください。** 1つでもオンのままだと、決済・時刻・メニューのいずれかが実際のバックエンドに接続されず、モックの値で動作してしまいます。

| 環境変数 | オンの時の挙動 |
|---|---|
| `VITE_USE_MOCK_PAYMENT` | カード・PayPayとも、バックエンドに一切接続せず決済成功画面まで到達できる(迂回策) |
| `VITE_USE_MOCK_MENU` | メニュー(価格・商品名・画像)をバックエンドに一切接続せず、ハードコードされたモック値で表示する |
| `VITE_USE_TEST_TIME` | 予約時刻の判定にテスト用の固定時刻を使う |

本番用の `.env.production` では、この3つとも `false` になっていることをデプロイ前に必ず確認してください。

## ⚠️ 決済まわりの現状(後任フロントエンド開発者向けの重要事項)

**`VITE_USE_MOCK_PAYMENT` をオンにすると、カード・PayPayどちらも決済成功画面まで到達できますが、これは完全にモックによる迂回策です。バックエンドへの注文作成・決済実行といった実際のAPI接続は一切行っていません。** 画面遷移が完了しても、DBには何も記録されません。

- クレジットカード・PayPayともに、決済基盤を**Square から自社の「PaySys」へ移行する方針**が確定しています。
- **PaySysの実装(バックエンドとの実連携)は後任フロントエンド開発者が担当します。** 現時点ではモック画面(`src/hooks/useCardPaymentFlow.ts`, `src/hooks/usePayPayPaymentFlow.ts`)のみが実装されており、`USE_MOCK_PAYMENT` がオフの場合は明示的に「未実装」のエラーを返すだけです。
- **Square関連のコードは削除せず`src/legacy/square/`配下に隔離しています。** 参考にはなりますが、どこからもimportされていない未使用コードです。誤って復活させないよう注意してください。詳細は「Squareコードの隔離について」を参照してください。

## メニュー取得まわりの現状

メニュー(価格・商品名・画像)は `GET /api/items/get/allItems` でバックエンドから取得します(`src/hooks/useMenuItems.ts`)。

- **`VITE_USE_MOCK_MENU` がオンの場合、バックエンドへ一切接続せず、`src/constants/mocks/menuMock.ts` のハードコードされた値のみでメニュー画面を表示します。** フロントエンドのみで(バックエンドを起動せずに)画面確認ができます。
- オフの場合、バックエンドから取得できなければ**メニュー画面に「メニューを取得できませんでした」と表示し、それ以上進めません**(ハードコード値へ黙って切り替えることはしません)。「再読み込み」ボタンで再取得できます。

## できること

- 商品とドリンクの選択
- 予約時刻の選択
- クレジットカード・PayPay決済(PaySys経由。**現状モックのみ**、実装は後任担当)
- 注文結果と番号札の表示
- 売り切れ状態の反映
- メニュー取得失敗時のエラー表示・再読み込み

## 開発環境

- Node.js 18 以上を推奨
- npm
- Git

## ビルドツールについて

このアプリは **TypeScript + Vite** を使用しています(旧・Create React App から移行済み)。

- ソースは基本的に `.ts` / `.tsx` です(`src/legacy/square/` のみ例外、上記「Squareコードの隔離について」参照)。
- `npm start` / `npm run dev` は Vite の開発サーバーを起動します(デフォルトポート 3000)。
- `npm run build` は `tsc --noEmit`(型チェックのみ、出力なし)→ `vite build` の順に実行します。型エラーがあるとビルドはそこで失敗します。
- `npm run preview` はビルド成果物(`dist/`)をローカルで確認できます。
- **テストは Vitest ではなく Jest のままです**(`babel-jest` + `@babel/preset-typescript` で型を単純に剥がして実行)。既存テストが `jest.resetModules()` と動的 `require()` を多用しており、Vitestへの書き換えはリスクが高いため、あえて据え置いています。
- `import.meta.env.VITE_X` は `babel-plugin-transform-vite-meta-env` により、Jest実行時は `process.env.VITE_X` に変換されます。同じソースコードがVite(ブラウザ)とJest(Node)の両方で動く仕組みです。

## セットアップ

```bash
npm ci
npm start
```

本番ビルドは以下です。

```bash
npm run build
```

テストは以下です。

```bash
npm test
```

## 環境変数

このアプリは Vite の仕組みで、`VITE_` で始まる環境変数を利用します(コード側は `import.meta.env.VITE_X` で参照)。

### `.env.local`

ローカル開発用です。個人のマシンでのみ使う設定を書きます。

- `VITE_USE_MOCK_PAYMENT` ⚠️ モックスイッチ(本番ではfalse必須)
- `VITE_USE_MOCK_MENU` ⚠️ モックスイッチ(本番ではfalse必須)
- `VITE_USE_TEST_TIME` ⚠️ モックスイッチ(本番ではfalse必須)
- `VITE_SQUARE_ENV` / `VITE_SQUARE_APP_ID` / `VITE_SQUARE_LOCATION_ID`(⚠️ 未使用。Square廃止に伴い`src/legacy/square/`の設定でのみ参照される)

開発中にモック動作を使う場合は、ここで `true` を設定します。

`VITE_USE_MOCK_PAYMENT=true` を設定すると、決済画面(カード・PayPayとも)がPaySysのモックのみを通す状態になります。**バックエンドへの実際のAPI接続は行われません。**

`VITE_USE_MOCK_MENU=true` を設定すると、メニュー画面がバックエンドへ接続せず、ハードコードされたモック値のみで表示されます。

`VITE_USE_TEST_TIME=true` を設定すると、予約時刻の表示や判定をテスト用の固定時刻で動かします。

### `.env.production`

本番ビルド用です。公開環境で使う設定を書きます。

- `VITE_USE_MOCK_PAYMENT=false`
- `VITE_USE_MOCK_MENU=false`
- `VITE_USE_TEST_TIME=false`

**本番では上記3つのモックスイッチを必ず全て `false` にしてください。** `USE_MOCK_PAYMENT=false` にしても、PaySysの実装が完了するまでは決済は「未実装」エラーになります(下記参照)。

### 既定値

- **`USE_MOCK_PAYMENT` / `USE_MOCK_MENU` / `USE_TEST_TIME` は、環境変数が未設定だと `true`(モックオン)になります。** `.env.production` に明示的に `false` を書かないと、本番ビルドでもモック動作になってしまうので注意してください。

## 画面の流れ

1. 開始画面
2. メニュー選択
3. ドリンク選択
4. カート確認
5. 予約時刻選択
6. 決済方法選択(クレジットカード / PayPay)
7. 決済画面(PaySys。現状モックのみ)
8. 決済結果
9. 番号札表示

## ディレクトリ構成の考え方

- `src/pages` は画面単位のコンポーネント
- `src/components` は再利用する UI 部品
- `src/hooks` は画面遷移や状態管理
- `src/features` は業務ロジック
- `src/services` は外部 API とのやり取り
- `src/utils` は汎用ユーティリティ
- `src/constants` は共通定数
- `src/legacy/square` は**未使用**。Square廃止に伴い隔離したコード(下記参照)

## Squareコードの隔離について

以前はSquareのクレジットカード決済を実装していましたが、決済基盤をPaySysへ一本化する方針により、Square関連のコードは`src/legacy/square/`配下へ移動し、**削除せず保管**しています。

- `src/legacy/square/hooks/usePaymentFlow.js`
- `src/legacy/square/components/PaymentBillingFields.jsx`
- `src/legacy/square/components/PaymentActionButton.jsx`
- `src/legacy/square/features/payment/paymentGateway.js`
- `src/legacy/square/features/payment/paymentScreen.js`
- `src/legacy/square/features/payment/paymentValidation.js`
- `src/legacy/square/services/squarePaymentService.js`
- `src/legacy/square/constants/mocks/cardPaymentMock.js`
- 対応するテスト(`src/legacy/square/__tests__/`)

各ファイルの冒頭に「⚠️ 未使用」のコメントがあります。**アクティブなコード(`src/legacy/square/`の外)からimportしないでください。** 将来Squareへの回帰や参考実装が必要になった場合のために残しています。`src/constants/config.ts`の`SQUARE_*`定数、`src/services/apiService.ts`の`getSquareConfig`/`chargeOrder`メソッドも同様に未使用としてコメントを付けていますが、削除はしていません。

なお `src/legacy/square/` 配下のファイル自体は、TypeScript移行(下記「ビルドツールについて」参照)の対象外とし、`.js`/`.jsx`のまま残しています。未使用コードのため型付けの実益がなく、`tsconfig.json`は`allowJs: false`のためビルド(`tsc --noEmit`)の対象にも含まれません。

## 運用上の注意

- 決済や注文の正本はバックエンドです。フロント側の localStorage は補助的な復元用です。
- **本番では `VITE_USE_MOCK_PAYMENT` / `VITE_USE_MOCK_MENU` / `VITE_USE_TEST_TIME` を必ず全て `false` にしてください。** 未設定の場合はデフォルトで `true`(モックオン)になる点に注意してください。
- 環境変数名は Vite の規約により `VITE_` プレフィックス必須です(CRA時代の `REACT_APP_` ではありません)。
- **PaySysの実バックエンド連携が完了するまでは、`USE_MOCK_PAYMENT=false` でも決済は完了しません**(明示的な未実装エラーになります)。

## 補足

- メニュー(価格・商品名・画像)と在庫状況はバックエンドの `GET /api/items/get/allItems` から取得します(`USE_MOCK_MENU=false` の場合)。
- 予約時間の扱いはテスト時刻の有無で変わります。
- ビルド成果物(`dist/`)は配布用であり、通常の開発ではソースと切り分けて扱うのが望ましいです(`.gitignore`済み)。
- バックエンドへの要望・修正依頼は `docs/backend-requirements.md` を参照してください。
- **後任フロントエンド開発者は、まず `docs/frontend-handover.md` を読んでください。** アプリの概要・設計・重要な定数・「どこを直せば何が変わるか」をまとめた仕様書です。特にPaySys決済の実装ガイドを重点的に記載しています。
