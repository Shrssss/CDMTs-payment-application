const ALLOWED_IDS = new Set([
  10, 20, 31, 32, 33, 34, 41, 42, 43, 44, 51, 52, 53, 54,
]);

export const buildOrderItems = (cart) =>
  Object.entries(cart)
    .map(([id, qty]) => ({ itemId: Number(id), quantity: Number(qty) }))
    .filter(({ itemId, quantity }) => quantity > 0 && ALLOWED_IDS.has(itemId));

/** Date → "HH:mm"（予約なしは null） */
export const formatReservedTimeHHmm = (dateOrNull) => {
  if (!dateOrNull) return null;
  const d = new Date(dateOrNull);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getHours())}:${p(d.getMinutes())}`;
};

/** "HH:mm" or ISO文字列 → Date（当日扱い/ISOはそのまま） */
export const parseReservedToDate = (value) => {
  if (!value) return null;
  // ISOなら new Date() が解釈
  if (value.includes("T") || value.includes("-")) {
    const d = new Date(value);
    return isNaN(d) ? null : d;
  }
  // "HH:mm" を今日の日付として扱う
  const [hh, mm] = value.split(":").map((v) => Number(v));
  if (isNaN(hh) || isNaN(mm)) return null;
  const now = new Date();
  const d = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hh,
    mm,
    0,
    0
  );
  return d;
};
