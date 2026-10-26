// reservationSchedule の時刻候補生成ルールを確認するテスト。
import { generateTimeOptions } from "../features/reservation/reservationSchedule";

describe("reservationSchedule", () => {
  const config = {
    START_OFFSET_MINUTES: 10,
    FIRST_ORDER_HOUR: 10,
    FIRST_ORDER_MINUTE: 0,
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

  // 受け取り開始時刻(10:00)より前にアクセスした場合、候補は10:00から始まる。
  test("starts from the first order time when accessed before opening", () => {
    const now = new Date(2026, 6, 2, 8, 30, 0);
    const options = generateTimeOptions(now, config);

    expect(options[0]).toEqual({ value: "10:00", label: "10:00" });
    expect(options[options.length - 1]).toEqual({ value: "17:05", label: "17:05" });
  });

  // 開始時刻の直前は、10分後の切り上げ結果が開始時刻を超えるのでそちらを優先する。
  test("uses the offset slot when it is later than the first order time", () => {
    const now = new Date(2026, 6, 2, 9, 57, 0);

    expect(generateTimeOptions(now, config)[0]).toEqual({ value: "10:10", label: "10:10" });
  });

  // 深夜のアクセスで翌日の時刻が候補に出ないこと。
  test("does not generate options for the next day", () => {
    const now = new Date(2026, 6, 2, 23, 55, 0);

    expect(generateTimeOptions(now, config)).toEqual([]);
  });
});
