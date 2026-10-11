// カート内容と合計金額を表示するページコンポーネント。
import { Order } from "../components/Order";
import { StepPageLayout } from "../components/StepPageLayout";
import type { Cart, NameMap, PriceMap } from "../types";

interface CartPageProps {
  cart: Cart;
  price: PriceMap;
  names: NameMap;
}

export const CartPage = ({ cart, price, names }: CartPageProps) => {
  return (
    <StepPageLayout>
      <p
        style={{
          textAlign: "center",
          fontSize: "22px",
          fontWeight: "bold",
          margin: "16px auto",
        }}
      >
        ご注文内容の確認
      </p>
      <div>
        <Order cart={cart} price={price} names={names} />
      </div>
    </StepPageLayout>
  );
};
