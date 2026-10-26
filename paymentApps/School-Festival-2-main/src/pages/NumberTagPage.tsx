// 番号札の表示内容を組み立てるページコンポーネント。
import { Order } from "../components/Order";
import { useAppContext } from "../context/AppContext";
import { INITIAL_PAYMENT_STATE } from "../constants/initialState";

export const NumberTagPage = () => {
  const { cart, prices: price, itemNames: names, paymentState, setPaymentState, dispatch, goto } = useAppContext();
  /** タイトル(注文履歴の一覧・新しい注文)へ戻る。 */
  const onBackToTitle = () => {
    setPaymentState((prev) => ({ ...prev, outcome: INITIAL_PAYMENT_STATE.outcome }));
    dispatch({ type: "RESET_CART" });
    goto("title");
  };
  return (
    <>
      <p
        style={{
          textAlign: "center",
          fontSize: "22px",
          fontWeight: "bold",
          margin: "16px auto",
        }}
      >
        ご注文ありがとうございます！
      </p>
      <p
        style={{
          textAlign: "center",
          fontSize: "20px",
          margin: "16px 0px 2px 0px",
        }}
      >
        注文番号
      </p>
      <p
        style={{
          textAlign: "center",
          fontSize: "60px",
          fontWeight: "bold",
          margin: "2px",
        }}
      >
        {paymentState.outcome.orderId ?? "NNNNN"}
      </p>
      {paymentState.outcome.displayReserved && (
        <p style={{ textAlign: "center", fontSize: 24, margin: "16px 0" }}>
          予約日時：{paymentState.outcome.displayReserved}
        </p>
      )}
      <Order cart={cart} price={price} names={names} />
      <div style={{ textAlign: "center", margin: "16px 0" }}>
        <button style={{ width: 200, height: 44, fontSize: 16 }} onClick={onBackToTitle}>
          タイトルに戻る
        </button>
      </div>
    </>
  );
};
