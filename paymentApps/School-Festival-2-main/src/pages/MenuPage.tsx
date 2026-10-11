// メニュー画面全体を組み立て、商品カードを並べるページコンポーネント。
// 商品画像はバックエンドのimagePathから取得する(未取得時はMenu.tsxがプレースホルダーを表示する)。
// fetchErrorがtrueの場合(ネットワーク不調時)は、商品グリッドの代わりに
// 「メニューを取得できませんでした」を表示する。
import type { CSSProperties } from "react";
import { Menu } from "../components/Menu";
import { StepPageLayout } from "../components/StepPageLayout";
import { PRODUCT_CATEGORIES } from "../constants/items";
import type { Cart, ImagePathMap, NameMap, PriceMap, SoldoutMap } from "../types";

const { PORK_SINGLE, PORK_SINGLE_LARGE, DRINK_SINGLE, PORK_DRINK_SET, PORK_DRINK_SET_LARGE } = PRODUCT_CATEGORIES;

interface MenuPageProps {
  prices: PriceMap;
  itemNames: NameMap;
  imagePaths: ImagePathMap;
  cart: Cart;
  addItems: (id: number) => void;
  removeItems: (id: number) => void;
  isSoldout: SoldoutMap;
  fetchError: boolean;
  onRetry?: () => void;
}

export const MenuPage = ({
  prices,
  itemNames,
  imagePaths,
  cart,
  addItems,
  removeItems,
  isSoldout,
  fetchError,
  onRetry,
}: MenuPageProps) => {
  if (fetchError) {
    return (
      <StepPageLayout>
        <div style={errorContainerStyle}>
          <p style={errorTextStyle}>メニューを取得できませんでした</p>
          <p style={errorSubTextStyle}>
            通信状況をご確認の上、もう一度お試しください。
          </p>
          {onRetry && (
            <button style={retryButtonStyle} onClick={onRetry}>
              再読み込み
            </button>
          )}
        </div>
      </StepPageLayout>
    );
  }

  return (
    <StepPageLayout>
      <div className="center-alignment">
        <div className="list-row">
          <Menu
            borderColor={"2px solid #ffbf7f"}
            backgroundColor={"#ffd3a8"}
            itemPrice={prices[PORK_DRINK_SET] as number}
            itemName={itemNames[PORK_DRINK_SET]}
            count={cart[PORK_DRINK_SET]}
            id={PORK_DRINK_SET}
            add={addItems}
            remove={removeItems}
            image={imagePaths[PORK_DRINK_SET]}
            isSoldout={isSoldout[PORK_DRINK_SET]}
          />
          <Menu
            borderColor={"2px solid #ffbf7f"}
            backgroundColor={"#ffd3a8"}
            itemPrice={prices[PORK_DRINK_SET_LARGE] as number}
            itemName={itemNames[PORK_DRINK_SET_LARGE]}
            count={cart[PORK_DRINK_SET_LARGE]}
            id={PORK_DRINK_SET_LARGE}
            add={addItems}
            remove={removeItems}
            image={imagePaths[PORK_DRINK_SET_LARGE]}
            isSoldout={isSoldout[PORK_DRINK_SET_LARGE]}
          />
        </div>
        <div className="list-row">
          <Menu
            borderColor={"2px solid #ffbf7f"}
            backgroundColor={"#ffd3a8"}
            itemPrice={prices[PORK_SINGLE] as number}
            itemName={itemNames[PORK_SINGLE]}
            count={cart[PORK_SINGLE]}
            id={PORK_SINGLE}
            add={addItems}
            remove={removeItems}
            image={imagePaths[PORK_SINGLE]}
            isSoldout={isSoldout[PORK_SINGLE]}
          />
          <Menu
            borderColor={"2px solid #ffbf7f"}
            backgroundColor={"#ffd3a8"}
            itemPrice={prices[PORK_SINGLE_LARGE] as number}
            itemName={itemNames[PORK_SINGLE_LARGE]}
            count={cart[PORK_SINGLE_LARGE]}
            id={PORK_SINGLE_LARGE}
            add={addItems}
            remove={removeItems}
            image={imagePaths[PORK_SINGLE_LARGE]}
            isSoldout={isSoldout[PORK_SINGLE_LARGE]}
          />
        </div>
        <div className="list-row">
          <Menu
            borderColor={"2px solid #ffbf7f"}
            backgroundColor={"#ffd3a8"}
            itemPrice={prices[DRINK_SINGLE] as number}
            itemName={itemNames[DRINK_SINGLE]}
            count={cart[DRINK_SINGLE]}
            id={DRINK_SINGLE}
            add={addItems}
            remove={removeItems}
            image={imagePaths[DRINK_SINGLE]}
            isSoldout={isSoldout[DRINK_SINGLE]}
          />
        </div>
      </div>
    </StepPageLayout>
  );
};

const errorContainerStyle: CSSProperties = {
  padding: "40px 20px",
  textAlign: "center",
};

const errorTextStyle: CSSProperties = {
  fontSize: "20px",
  fontWeight: "bold",
  color: "#c0392b",
  margin: "8px 0",
};

const errorSubTextStyle: CSSProperties = {
  fontSize: "14px",
  color: "#666",
  margin: "8px 0 20px 0",
};

const retryButtonStyle: CSSProperties = {
  padding: "10px 24px",
  fontSize: "16px",
  fontWeight: "bold",
  borderRadius: "8px",
  border: "2px solid #222",
  backgroundColor: "#fff",
  cursor: "pointer",
};
