// ドリンク選択画面。商品画像はバックエンドのimagePathから取得する
// 画像取得失敗時はimgタグデフォルトの見た目にする（お客さんが不具合があることを理解するため）
import { Menu } from "../components/Menu";
import { StepPageLayout } from "../components/StepPageLayout";
import { PRODUCT_CATEGORIES } from "../constants/items";
import { useAppContext } from "../context/AppContext";

const { COLA, ORANGE, CIDER, OOLONG } = PRODUCT_CATEGORIES;

export const DrinkPage = () => {
  const { itemNames, imagePaths, cart, addItems, removeItems, isSoldout, calculateDifferenceOfDrinks } =
    useAppContext();
  const difference = calculateDifferenceOfDrinks();
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
            isDrink
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
            isDrink
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
            isDrink
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
            isDrink
          />
        </div>
      </div>
    </StepPageLayout>
  );
};
