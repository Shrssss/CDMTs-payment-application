// タイトル画面全体を組み立てるページコンポーネント。
import { Title } from "../components/Title";
import type { OrderSnapshot } from "../types";

interface TitlePageProps {
  onStart: () => void;
  onOpenLegalNotice: () => void;
  savedOrders?: OrderSnapshot[];
  onViewSavedOrder?: (key: string) => void;
}

export const TitlePage = ({ onStart, onOpenLegalNotice, savedOrders, onViewSavedOrder }: TitlePageProps) => {
  return (
    <Title
      onStart={onStart}
      onOpenLegalNotice={onOpenLegalNotice}
      savedOrders={savedOrders}
      onViewSavedOrder={onViewSavedOrder}
    />
  );
};
