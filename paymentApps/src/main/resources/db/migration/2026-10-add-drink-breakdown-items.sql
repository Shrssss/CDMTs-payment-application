-- ドリンク付き商品の内訳商品(31〜34 / 41〜44 / 51〜54)を商品マスタに登録する。
--
-- 注文時、サーバー(DrinkAllocator)が「カテゴリ + ドリンク番号の下1桁」の内訳商品として明細を保存する。
--   例) 角煮ドリンクセット(40) + コーラ(91) → 41「【お得】角煮ドリンクセット（コーラ）」
-- 明細の ITEMID には ITEM_TABLE への外部キーがあり、決済金額も明細の ITEMID の価格で計算するため、
-- 内訳商品が無いと注文の保存に失敗する。
--
-- 名前と価格は親カテゴリ(30/40/50)とドリンク(91〜94)の現在の値から作る。何度流してもよい
-- (既にある行は名前と価格を親に合わせて更新する)。
-- 親カテゴリの価格を変えたときは、このファイルをもう一度流して内訳商品の価格を揃えること。
--
-- 前提: ITEM_TABLE に 30/40/50 と 91〜94 が登録済みであること。

INSERT INTO ITEM_TABLE (ITEMID, ITEM_NAME, PRICE, IMAGE_PATH, AVAILABLE)
SELECT * FROM (
    SELECT
        p.ITEMID + MOD(d.ITEMID, 10)             AS NEW_ITEMID,
        CONCAT(p.ITEM_NAME, '（', d.ITEM_NAME, '）') AS NEW_ITEM_NAME,
        p.PRICE                                   AS NEW_PRICE,
        p.IMAGE_PATH                              AS NEW_IMAGE_PATH,
        TRUE                                      AS NEW_AVAILABLE
    FROM ITEM_TABLE p
    JOIN ITEM_TABLE d ON d.ITEMID IN (91, 92, 93, 94)
    WHERE p.ITEMID IN (30, 40, 50)
) AS breakdown
ON DUPLICATE KEY UPDATE
    ITEM_NAME = breakdown.NEW_ITEM_NAME,
    PRICE = breakdown.NEW_PRICE;
