# CODE MATES Payment-Order Application バックエンド仕様書

- 対象: `paymentApps`（Spring Boot / MyBatis / MySQL / Square API）
- バージョン: 1.0
- 作成日: 2026-08-24

---

## 1. 概要

本アプリケーションは、注文（Order）・注文商品明細（OrderItem）・商品マスタ（Item）を管理し、
Square Payments API を利用して決済処理を行うバックエンドAPIである。

### 1.1 技術スタック

| 項目 | 内容 |
|---|---|
| フレームワーク | Spring Boot 3.5.6 |
| 言語 | Java 21 |
| O/Rマッパー | MyBatis (mybatis-spring-boot-starter 3.0.5) |
| DB | MySQL 8.x |
| 決済連携 | Square API（`com.squareup.square:square:45.0.0.20250924`） |
| 認証/CORS | 許可オリジン `https://cdmts-pay.codemates.net` のみ |

### 1.2 パッケージ構成

```
com.cdmts.paymentApps
├── controller   … REST APIエンドポイント
├── service      … 業務ロジック
├── mapper       … MyBatis Mapperインターフェース
├── model.entity … DBエンティティ
├── model.dto    … リクエスト/レスポンスDTO
└── config       … Spring/Square設定
```

---

## 2. データモデル

### 2.1 エンティティ一覧

#### Order（注文）

| フィールド | 型 | 説明 |
|---|---|---|
| orderId | Long | 注文番号（主キー、自動採番） |
| orderDate | LocalDateTime | 注文日時 |
| reservedTime | LocalDateTime | 予約時間 |
| servingStatus | Short | 受け渡し状態（0, 1, 2） |
| paymentId | String | Square決済ID（決済完了後にセット） |
| paymentStatus | Boolean | 決済状況（true=決済完了） |
| idempotencyKey | String | Square API冪等キー（決済試行後にセット） |

#### OrderItem（注文商品明細）

| フィールド | 型 | 説明 |
|---|---|---|
| orderItemId | Long | 明細番号（主キー、自動採番） |
| orderId | Long | 注文番号（外部キー） |
| itemId | Long | 商品番号（外部キー） |
| quantity | Integer | 注文数量 |

#### Item（商品マスタ）

| フィールド | 型 | 説明 |
|---|---|---|
| itemId | Long | 商品番号（主キー、自動採番） |
| itemName | String | 商品名 |
| price | Integer | 単価（円） |
| available | Boolean | 在庫の有無（true=販売可能） |

### 2.2 テーブル定義（推定）

Mapper XMLのカラム参照から推定される論理定義。実DDLは別途管理。

```sql
ORDER_TABLE (
  ORDERID          BIGINT AUTO_INCREMENT PRIMARY KEY,
  ORDER_DATE       DATETIME,
  RESERVED_TIME    DATETIME,
  SERVING_STATUS   TINYINT,
  PAYMENTID        VARCHAR(255),
  PAYMENT_STATUS   BOOLEAN,
  IDEMPOTENCY_KEY  VARCHAR(255)
)

ORDER_ITEM_TABLE (
  ORDER_ITEM_ID  BIGINT AUTO_INCREMENT PRIMARY KEY,
  ORDERID        BIGINT,   -- FK: ORDER_TABLE.ORDERID
  ITEMID         BIGINT,   -- FK: ITEM_TABLE.ITEMID
  QUANTITY       INT
)

ITEM_TABLE (
  ITEMID      BIGINT AUTO_INCREMENT PRIMARY KEY,
  ITEM_NAME   VARCHAR(255),
  PRICE       INT,
  AVAILABLE   BOOLEAN
)
```

---

## 3. API仕様

共通事項:
- ベースURL: `/api`
- CORS許可オリジン: `https://cdmts-pay.codemates.net`
- レスポンスはすべてJSON

### 3.1 注文 API（`/api/orders`）

| # | メソッド名 | HTTP | パス | 概要 |
|---|---|---|---|---|
| 1 | createOrder | POST | `/api/orders/set` | 注文を新規作成する |
| 2 | getOrdersByIds | GET | `/api/orders/get/byOrderIds` | 注文IDのリストから注文情報を取得する |
| 3 | updateServingStatus | PUT | `/api/orders/update/servingStatus/{orderId}/{servingStatus}` | 受け渡し状態を更新する |
| 4 | getServingStatusByOrderId | GET | `/api/orders/get/servingStatus/{orderId}` | 注文IDから受け渡し状態を取得する |
| 5 | getOrdersByServingStatus | GET | `/api/orders/get/byServingStatus/{servingStatus}` | 受け渡し状態から注文一覧を取得する |

> `updatePaymentStatus`（`PUT /api/orders/update/paymentStatus/{orderId}/{paymentStatus}`）は
> **無効化（コメントアウト）済み**。決済状況は `POST /api/payments/create/{orderId}/{sourceId}` の
> 決済結果によってのみ更新される仕様とし、クライアントから直接書き換えられる経路を廃止した。

#### 3.1.1 POST `/api/orders/set`

- リクエストボディ（`OrderCreateRequest`）

```json
{
  "orderDate": "2026-08-24T12:00:00",
  "reservedTime": "2026-08-24T12:30:00",
  "servingStatus": 0,
  "paymentStatus": false,
  "items": [
    { "itemId": 1, "quantity": 2 },
    { "itemId": 3, "quantity": 1 }
  ]
}
```

- レスポンス: 作成された `orderId`（`Long`）
- 処理概要:
  1. `Order` を1件INSERTし、採番された `orderId` を取得
  2. 各 `items` を `OrderItem` に変換し、`orderId` を紐付けて一括INSERT
  3. `Order` のINSERT件数が1件でない、または `OrderItem` のINSERT件数が0件以下の場合は `IllegalArgumentException`

#### 3.1.2 GET `/api/orders/get/byOrderIds`

- クエリパラメータ: `orderIds`（`List<Long>`、カンマ区切り or 同名複数指定）
- レスポンス: `List<OrderResponse>`

```json
[
  { "orderId": 1, "orderDate": "...", "reservedTime": "...", "servingStatus": 0 }
]
```

#### 3.1.3 PUT `/api/orders/update/servingStatus/{orderId}/{servingStatus}`

- パスパラメータ: `orderId`（Long）, `servingStatus`（Short: 0/1/2）
- レスポンス: 更新した `orderId`
- 更新件数が1件でない場合は `IllegalArgumentException`

#### 3.1.4 GET `/api/orders/get/servingStatus/{orderId}`

- パスパラメータ: `orderId`（Long）
- レスポンス: `servingStatus`（Short）

#### 3.1.5 GET `/api/orders/get/byServingStatus/{servingStatus}`

- パスパラメータ: `servingStatus`（Short）
- レスポンス: `List<OrderResponse>`

---

### 3.2 商品 API（`/api/items`）

| # | メソッド名 | HTTP | パス | 概要 |
|---|---|---|---|---|
| 1 | getItemsByItemIds | GET | `/api/items/get/byItemIds` | 商品IDのリストから商品情報を取得する |
| 2 | selectAllItems | GET | `/api/items/get/allItems` | 全商品を取得する |
| 3 | updateAvailablity | PUT | `/api/items/update/available/{available}` | 複数商品の在庫状況を一括更新する |
| 4 | createItems | POST | `/api/items` | 商品を一括登録する（事前登録） |

#### 3.2.1 GET `/api/items/get/byItemIds`

- クエリパラメータ: `itemIds`（`List<Long>`）
- レスポンス: `List<ItemResponse>`

```json
[
  { "itemId": 1, "itemName": "たこ焼き", "price": 500, "available": true }
]
```

#### 3.2.2 GET `/api/items/get/allItems`

- レスポンス: `List<ItemResponse>`（全件）

#### 3.2.3 PUT `/api/items/update/available/{available}`

- パスパラメータ: `available`（Boolean）
- クエリパラメータ: `itemIds`（`List<Long>`）
- レスポンス: 更新した `itemIds`
- 更新件数がリクエストの `itemIds` 件数と一致しない場合は `IllegalArgumentException`

#### 3.2.4 POST `/api/items`

- リクエストボディ（`List<ItemCreateRequest>`）

```json
[
  { "itemName": "から揚げ", "price": 400, "available": true }
]
```

- レスポンス: 生成された `itemId` のリスト（`List<Long>`）
- 登録件数がリクエスト件数と一致しない場合は `IllegalArgumentException`

---

### 3.3 決済 API（`/api`）

| # | メソッド名 | HTTP | パス | 概要 |
|---|---|---|---|---|
| 1 | createPayment | POST | `/api/payments/create/{orderId}/{sourceId}` | Square APIで決済を実行する |
| 2 | getSquareClient | GET | `/api/square/config` | フロントエンド用のSquare接続情報を取得する |

#### 3.3.1 POST `/api/payments/create/{orderId}/{sourceId}`

- パスパラメータ:
  - `orderId`（Long）: 決済対象の注文ID
  - `sourceId`（String）: Square Web Payments SDKが発行するカード情報トークン
- レスポンス（`PaymentResponse`）

```json
{
  "paymentId": "xxxx",
  "status": "COMPLETED",
  "amount": 900,
  "currency": "JPY",
  "hasKeyError": false
}
```

- 処理フロー:
  1. `orderId` から `Order` と `OrderItem` 一覧を取得（存在しない場合は例外）
  2. `OrderItem` に紐づく `Item` を取得し、単価×数量で合計金額（`totalAmount`）を算出
  3. 二重決済防止チェック
     - `Order.paymentStatus` が `true`、または `Order.idempotencyKey` が既に設定済みの場合は
       `hasKeyError = true` として決済を実行せずレスポンスを返す
  4. 新規の冪等キー（UUID）を発行し、Square Payments APIへ決済作成リクエストを送信
  5. 作成された決済情報を取得し、`PaymentResponse` に反映
  6. `Order` テーブルの `paymentId` / `paymentStatus` / `idempotencyKey` を更新
     （`paymentStatus` は Square のステータスが `COMPLETED` の場合のみ `true`）

- 例外時: Square API呼び出しで例外（`SquareApiException`）が発生した場合、`RuntimeException` にラップして送出

#### 3.3.2 GET `/api/square/config`

- レスポンス: フロントエンドがSquare Web Payments SDKを初期化するための設定値

```json
{
  "applicationId": "...",
  "locationId": "...",
  "environment": "PRODUCTION"
}
```

> ⚠️ `locationId` は現状 sandbox 用の値がハードコードされている（コード内コメントに明記）。
> 本番運用前に `environment` と `locationId` の組み合わせを必ず確認すること。

---

## 4. 設定

### 4.1 `application.yaml`（抜粋・修正後）

```yaml
spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/release_db?useSSL=false&serverTimezone=Asia/Tokyo&allowPublicKeyRetrieval=false
    username: test_user
    password: ${DB_PASSWORD:password}
    driver-class-name: com.mysql.cj.jdbc.Driver
    hikari:
      maximum-pool-size: 10

mybatis:
  mapper-locations: classpath:mapper/*.xml

server:
  port: 8080
  address: 0.0.0.0
  use-forward-headers: true
```

### 4.2 環境変数

| 変数名 | 用途 |
|---|---|
| `SQUARE_TOKEN` | Square APIアクセストークン（`SquareConfig` が起動時に読み込む） |
| `DB_PASSWORD` | MySQL接続パスワード（未設定時は `password` がデフォルト） |

### 4.3 Mapperスキャン

```java
@SpringBootApplication
@MapperScan("com.cdmts.paymentApps.mapper")
public class DemoApplication { ... }
```

---

## 5. Mapper（MyBatis）仕様

### 5.1 OrderMapper

| メソッド | SQL概要 |
|---|---|
| `selectOrdersByOrderIds(List<Long> orderIds)` | `ORDERID IN (...)` で複数件取得 |
| `selectAllOrders()` | 全件取得 |
| `selectServingStatusByOrderId(Long orderId)` | 単一注文の受け渡し状態を取得 |
| `selectOrdersByServingStatus(Short servingStatus)` | 受け渡し状態で絞り込み取得 |
| `insertOrder(Order order)` | 1件登録（`useGeneratedKeys` で `orderId` を反映） |
| `updateServingStatusByOrderId(Long orderId, Short servingStatus)` | 受け渡し状態を更新 |
| `updatePaymentStatusByOrderId(Long orderId, Boolean paymentStatus)` | 決済状況を更新（※現在Controllerからは未使用） |

### 5.2 OrderItemMapper

| メソッド | SQL概要 |
|---|---|
| `selectOrderItemsByOrderId(Long orderId)` | 注文IDに紐づく明細を取得 |
| `insertOrderItems(List<OrderItem> items)` | 複数件を一括INSERT（`useGeneratedKeys` で `orderItemId` を各要素へ反映） |

### 5.3 ItemMapper

| メソッド | SQL概要 |
|---|---|
| `selectItemsByItemIds(List<Long> itemIds)` | `ITEMID IN (...)` で複数件取得 |
| `selectAllItems()` | 全件取得 |
| `insertItems(List<Item> items)` | 複数件を一括INSERT（`useGeneratedKeys` で `itemId` を各要素へ反映） |
| `updateItemAvailabilityByItemId(List<Long> itemIds, Boolean available)` | 複数商品の在庫状況を一括更新 |

### 5.4 PaymentMapper

| メソッド | SQL概要 |
|---|---|
| `selectPaymentStatusByOrderId(Long orderId)` | 決済状況を取得（現状未使用・予備） |
| `selectIdempotencyKeyByOrderId(Long orderId)` | 冪等キーを取得（現状未使用・予備） |
| `updatePaymentIdAndStatusAndKey(Long orderId, String paymentId, Boolean paymentStatus, String idempotencyKey)` | 決済完了後、`Order` の決済関連カラムを一括更新 |

---

## 6. 業務ルール・制約

1. **注文の決済状況は決済APIのみが更新する**
   `updatePaymentStatus` エンドポイントは廃止済み。決済状況（`Order.paymentStatus`）は
   `PaymentService.createPayment()` の実行結果によってのみ更新される。
2. **二重決済防止**
   `Order.paymentStatus == true`、または `Order.idempotencyKey` が既に設定されている注文に対しては
   決済処理を行わず、`hasKeyError = true` を返す。
3. **金額計算**
   決済金額は `OrderItem` に紐づく `Item.price × OrderItem.quantity` の合計値とする
   （`OrderPaymentResponse.getTotalAmount()`）。
4. **通貨**
   決済通貨は `JPY` 固定。
5. **在庫更新**
   `updateAvailablity` はリクエストの `itemIds` 件数と実際の更新件数が一致しない場合は例外とする
   （一部IDが存在しない場合の不整合検知）。

---

---

## 7. 変更点（2026-08-27）

今回のバックエンドコードを確認し、既存の仕様書に対して以下の変更・追加点を追記する。

### 7.1 商品情報に画像パスを追加

`Item` エンティティおよび商品関連DTOに `imagePath` を追加した。

- `Item.imagePath`：商品画像のパス
- `ItemCreateRequest.imagePath`：商品登録時の画像パス
- `ItemResponse.imagePath`：商品取得時の画像パス
- `ItemMapper.xml` のSELECT/INSERTにも `IMAGE_PATH` を追加

これにより、商品情報は以下の構成となる。

| フィールド | 型 | 説明 |
|---|---|---|
| itemId | Long | 商品番号 |
| itemName | String | 商品名 |
| price | Integer | 単価 |
| imagePath | String | 商品画像のパス |
| available | Boolean | 在庫の有無 |

### 7.2 注文取得時に注文商品明細を返却

注文取得処理を拡張し、`OrderResponse` に `orderedItems` を含めるようになった。

`OrderService.getOrdersByIds()` および `getOrdersByServingStatus()` では、

1. 注文情報を取得
2. 注文IDに紐づく商品明細を取得
3. 商品ID・商品名・数量を注文IDごとにグループ化
4. `OrderResponse.OrderedItem` としてレスポンスへ格納

という処理を行う。

`OrderResponse.OrderedItem` の項目は以下のとおり。

| フィールド | 型 | 説明 |
|---|---|---|
| itemId | Long | 商品番号 |
| name | String | 商品名 |
| quantity | Integer | 注文数量 |

### 7.3 注文商品取得用Mapper処理を追加

`OrderMapper` に `selectOrderedItemsByOrderIds(List<Long> orderIds)` を追加し、
複数の注文IDに紐づく商品情報をまとめて取得する処理を追加した。

取得対象は以下。

- orderId
- itemId
- itemName（レスポンス上は `name`）
- quantity

なお、現在の `OrderMapper.xml` ではSQLのカラム名に `ORDER_ID` / `ITEM_ID` を使用している一方、
既存のテーブル定義では `ORDERID` / `ITEMID` が使用されているため、実DBのカラム名との整合性を確認する必要がある。

### 7.4 注文一覧を受け渡し状態から取得するAPIを追加

以下のAPIを追加した。

`GET /api/orders/get/byServingStatus/{servingStatus}`

指定した `servingStatus` の注文一覧を取得し、各注文の商品明細も `orderedItems` として返却する。

また、該当する注文が0件の場合は、商品明細取得用SQLを実行せず空のリストを使用する。

### 7.5 商品一括登録APIを追加

以下のAPIを追加した。

`POST /api/items`

複数の `ItemCreateRequest` を受け取り、商品を一括登録する。

レスポンスは生成された `itemId` のリスト。

登録件数とリクエスト件数が一致しない場合は `IllegalArgumentException` を送出する。

### 7.6 商品在庫状況の一括更新を追加

以下のAPIを追加した。

`PUT /api/items/update/available/{available}`

クエリパラメータ `itemIds` で指定された複数商品について、
`available` を一括更新する。

更新件数と指定された `itemIds` の件数が一致しない場合は
`IllegalArgumentException` を送出する。

### 7.7 商品一覧取得APIを追加

以下のAPIを追加した。

`GET /api/items/get/allItems`

商品テーブルの全商品を取得し、`ItemResponse` のリストとして返却する。

### 7.8 Square設定の本番環境化

`SquareConfig` で生成する `SquareClient` の環境を `Environment.PRODUCTION` に設定した。

また、`application.yaml` でも以下の設定となっている。

```yaml
square:
  environment: production
  access-token: ${SQUARE_TOKEN}
```

Squareのアクセストークンは環境変数 `SQUARE_TOKEN` から取得する。

### 7.9 CORS設定を追加・整理

`WebConfig` に `/api/**` を対象としたCORS設定を追加した。

許可オリジン：

```text
https://cdmts-pay.codemates.net
```

許可メソッド：

- GET
- POST
- PUT
- DELETE
- OPTIONS

さらに、`OrderController` および `ItemController` にも同一オリジンを対象とする `@CrossOrigin` を設定している。

### 7.10 決済処理の二重実行防止を強化

`PaymentService.createPayment()` では、以下の場合にSquareへの決済処理を実行しない。

- `paymentStatus == true`
- `idempotencyKey` が既に設定されている

該当した場合は `PaymentResponse.hasKeyError = true` として返却する。

通常の決済ではUUIDを利用して新しい冪等キーを生成し、Square APIへ送信する。

決済後は以下を `Order` テーブルへ保存する。

- `paymentId`
- `paymentStatus`
- `idempotencyKey`

### 7.11 Square決済結果の再取得

決済作成後、Square APIから決済IDを取得するだけでなく、
`payments().get()` を利用して決済詳細を再取得する処理を追加している。

再取得した決済情報から以下を `PaymentResponse` に設定する。

- paymentId
- status
- amount
- currency
- hasKeyError

`status` が `COMPLETED` の場合のみ `paymentStatus` を `true` とする。

### 7.12 トランザクション管理を追加

注文作成、商品登録、在庫更新、提供状態更新、決済処理などのサービス処理に
`@Transactional` を使用している。

特に注文作成では、

1. `ORDER_TABLE` に注文を登録
2. 採番された `orderId` を取得
3. 注文商品を `ORDER_ITEM_TABLE` に一括登録

を1つのトランザクションとして処理する。

