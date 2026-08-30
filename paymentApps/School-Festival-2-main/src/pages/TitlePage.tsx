// タイトル画面全体を組み立てるページコンポーネント。
import { Title } from "../components/Title";

interface TitlePageProps {
  onStart: () => void;
  onOpenLegalNotice: () => void;
  hasSavedOrder?: boolean;
  onViewSavedOrder?: () => void;
}

export const TitlePage = ({ onStart, onOpenLegalNotice, hasSavedOrder, onViewSavedOrder }: TitlePageProps) => {
  return (
    <Title
      onStart={onStart}
      onOpenLegalNotice={onOpenLegalNotice}
      hasSavedOrder={hasSavedOrder}
      onViewSavedOrder={onViewSavedOrder}
    />
  );
};
