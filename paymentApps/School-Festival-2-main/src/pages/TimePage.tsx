// 予約時刻の選択画面を組み立てるページコンポーネント。
import { TimeSelect } from "../components/TimeSelect";
import { StepPageLayout } from "../components/StepPageLayout";

interface TimePageProps {
  onTimeChange?: (value: string) => void;
  testTime?: Date | null;
}

export const TimePage = ({ onTimeChange, testTime }: TimePageProps) => {
  return (
    <StepPageLayout spacerHeight="0px">
      <div className="reservation-page-wrapper">
        <TimeSelect onTimeChange={onTimeChange} testTime={testTime} />
      </div>
    </StepPageLayout>
  );
};
