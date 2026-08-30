// reservationSchedule の時刻候補生成ルールを確認するテスト。
import { generateTimeOptions } from "../features/reservation/reservationSchedule";

describe("reservationSchedule", () => {
  const config = {
    START_OFFSET_MINUTES: 10,
    LAST_ORDER_HOUR: 17,
    LAST_ORDER_MINUTE: 10,
    INTERVAL_MINUTES: 5,
  };

  test("generates rounded reservation options from the next available slot", () => {
    const now = new Date(2026, 6, 2, 16, 50, 0);

    expect(generateTimeOptions(now, config)).toEqual([
      { value: "17:00", label: "17:00" },
      { value: "17:05", label: "17:05" },
    ]);
  });

  // 最終受付時刻(17:10)そのものは「受付終了」扱いなので、候補には含まれない
  // (stepRules.tsの締切判定と挙動を揃えるための仕様。isPastLastOrderTimeが
  // 17:10以降をtrueとして扱うことと対応する)。
  test("excludes the last order time itself from the candidates", () => {
    const now = new Date(2026, 6, 2, 16, 56, 0);

    expect(generateTimeOptions(now, config)).toEqual([]);
  });

  test("stops at the last order time", () => {
    const now = new Date(2026, 6, 2, 17, 1, 0);

    expect(generateTimeOptions(now, config)).toEqual([]);
  });
});