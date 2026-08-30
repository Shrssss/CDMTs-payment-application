import { buildOrderItems, formatReservedTimeHHmm, parseReservedToDate } from "../utils/orderUtils";

describe("orderUtils", () => {
  test("buildOrderItems splits category items and drink counts, filtering invalid/zero quantities", () => {
    const result = buildOrderItems({
      10: 2,
      30: 1,
      40: 0,
      91: 3,
      92: 0,
      999: 5,
    });

    expect(result).toEqual({
      items: [
        { itemId: 10, quantity: 2 },
        { itemId: 30, quantity: 1 },
      ],
      drinkCounts: { 91: 3 },
    });
  });

  test("formatReservedTimeHHmm formats a date as HH:mm", () => {
    const date = new Date(2026, 6, 2, 9, 5, 0);

    expect(formatReservedTimeHHmm(date)).toBe("09:05");
  });

  test("formatReservedTimeHHmm returns null for null/undefined input", () => {
    expect(formatReservedTimeHHmm(null)).toBeNull();
    expect(formatReservedTimeHHmm(undefined)).toBeNull();
  });

  test("parseReservedToDate accepts an ISO string", () => {
    const parsed = parseReservedToDate("2026-07-02T12:34:00.000Z");

    expect(parsed).toBeInstanceOf(Date);
    expect(parsed?.toISOString()).toBe("2026-07-02T12:34:00.000Z");
  });

  test("parseReservedToDate accepts an HH:mm string, applied to the given baseDate (or today if omitted)", () => {
    const baseDate = new Date(2026, 6, 2, 0, 0, 0);
    const parsed = parseReservedToDate("13:15", baseDate);

    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(6);
    expect(parsed?.getDate()).toBe(2);
    expect(parsed?.getHours()).toBe(13);
    expect(parsed?.getMinutes()).toBe(15);

    // baseDateを省略した場合は現在時刻の年月日が使われる
    const today = new Date();
    const withoutBase = parseReservedToDate("08:00");
    expect(withoutBase?.getFullYear()).toBe(today.getFullYear());
    expect(withoutBase?.getMonth()).toBe(today.getMonth());
    expect(withoutBase?.getDate()).toBe(today.getDate());
  });

  test("parseReservedToDate returns null for unparseable or out-of-range input", () => {
    expect(parseReservedToDate(null)).toBeNull();
    expect(parseReservedToDate(undefined)).toBeNull();
    expect(parseReservedToDate("")).toBeNull();
    expect(parseReservedToDate("not a date")).toBeNull();
    expect(parseReservedToDate("99:99")).toBeNull();
    expect(parseReservedToDate("25:00")).toBeNull();
  });
});