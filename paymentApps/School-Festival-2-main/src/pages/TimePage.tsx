// 予約時刻の選択画面を組み立てるページコンポーネント。
import { TimeSelect } from "../components/TimeSelect";
import { StepPageLayout } from "../components/StepPageLayout";
import { useAppContext } from "../context/AppContext";

export const TimePage = () => {
  const { setSelectedTime: onTimeChange, currentTestTime } = useAppContext();
  const testTime = currentTestTime || null;
  return (
    <StepPageLayout spacerHeight="0px">
      <div className="reservation-page-wrapper">
        <TimeSelect onTimeChange={onTimeChange} testTime={testTime} />
      </div>
    </StepPageLayout>
  );
};
