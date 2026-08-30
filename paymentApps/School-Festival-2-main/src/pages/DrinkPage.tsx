// ドリンク選択画面。商品画像はバックエンドのimagePathから取得する
// (未取得時はMenu.tsxがプレースホルダーを表示する)。
import { Menu } from "../components/Menu";
import { StepPageLayout } from "../components/StepPageLayout";
import { PRODUCT_CATEGORIES } from "../constants/items";
import type { Cart, ImagePathMap, NameMap, SoldoutMap } from "../types";

const { COLA, ORANGE, CIDER, OOLONG } = PRODUCT_CATEGORIES;

interface DrinkPageProps {
  itemNames: NameMap;
  imagePaths: ImagePathMap;
  cart: Cart;
  addItems: (id: number) => void;
  removeItems: (id: number) => void;
  difference: number;
  isSoldout: SoldoutMap;
}

export const DrinkPage = ({ itemNames, imagePaths, cart, addItems, removeItems, difference, isSoldout }: DrinkPageProps) => {
  return (
    <StepPageLayout>
      <p
        style={{
          textAlign: "center",
          fontSize: "22px",
          margin: "10px auto",
        }}
      >
        飲み物を選択してください
      </p>
      {difference > 0 && (
        <p
          style={{
            textAlign: "center",
            fontSize: "30px",
            fontWeight: "bold",
            margin: "10px auto",
            backgroundColor: "#9eceff",
          }}
        >
          {`あと ${difference} 個`}
        </p>
      )}
      {difference === 0 && (
        <p
          style={{
            textAlign: "center",
            fontSize: "30px",
            fontWeight: "bold",
            margin: "10px auto",
            backgroundColor: "#9eceff",
          }}
        >
          OK！
        </p>
      )}
      {difference < 0 && (
        <p
          style={{
            textAlign: "center",
            fontSize: "30px",
            fontWeight: "bold",
            margin: "10px auto",
            backgroundColor: "#9eceff",
          }}
        >
          数を減らしてください
        </p>
      )}
      <div className="center-alignment">
        <div className="list-row">
          <Menu
            borderColor={"2px solid #7fbfff"}
            backgroundColor={"#a8d3ff"}
            itemName={itemNames[COLA]}
            count={cart[COLA]}
            id={COLA}
            add={addItems}
            remove={removeItems}
            difference={difference}
            isDrinkScreen={true}
            image={imagePaths[COLA]}
            isSoldout={isSoldout[COLA]}
          />
          <Menu
            borderColor={"2px solid #7fbfff"}
            backgroundColor={"#a8d3ff"}
            itemName={itemNames[ORANGE]}
            count={cart[ORANGE]}
            id={ORANGE}
            add={addItems}
            remove={removeItems}
            difference={difference}
            isDrinkScreen={true}
            image={imagePaths[ORANGE]}
            isSoldout={isSoldout[ORANGE]}
          />
        </div>
        <div className="list-row">
          <Menu
            borderColor={"2px solid #7fbfff"}
            backgroundColor={"#a8d3ff"}
            itemName={itemNames[CIDER]}
            count={cart[CIDER]}
            id={CIDER}
            add={addItems}
            remove={removeItems}
            difference={difference}
            isDrinkScreen={true}
            image={imagePaths[CIDER]}
            isSoldout={isSoldout[CIDER]}
          />
          <Menu
            borderColor={"2px solid #7fbfff"}
            backgroundColor={"#a8d3ff"}
            itemName={itemNames[OOLONG]}
            count={cart[OOLONG]}
            id={OOLONG}
            add={addItems}
            remove={removeItems}
            difference={difference}
            isDrinkScreen={true}
            image={imagePaths[OOLONG]}
            isSoldout={isSoldout[OOLONG]}
          />
        </div>
      </div>
    </StepPageLayout>
  );
};
