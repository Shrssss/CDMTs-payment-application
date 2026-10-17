// タイトル画面全体を組み立てるページコンポーネント。
import { Title } from "../components/Title";
import { useAppContext } from "../context/AppContext";

export const TitlePage = () => {
  const { dispatch, next, openLegalNotice, savedOrders, viewSavedOrder } = useAppContext();
  return (
    <Title
      onStart={() => {
        // 過去の注文を表示した後でも、新しい注文は空のカートから始める。
        dispatch({ type: "RESET_CART" });
        next();
      }}
      onOpenLegalNotice={openLegalNotice}
      savedOrders={savedOrders}
      onViewSavedOrder={viewSavedOrder}
    />
  );
};
