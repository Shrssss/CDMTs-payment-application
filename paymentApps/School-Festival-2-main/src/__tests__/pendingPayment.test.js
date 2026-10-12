import { savePendingPayment, readPendingPayment, getPaymentReturn, PENDING_PAYMENT_KEY } from "../features/payment/pendingPayment";
import { Api } from "../services/apiService";

const pending = { orderId: 42, sid: "O16", method: "paypay", cart: { 10: 2 },
  reservedAtIso: "2026-10-12T04:00:00.000Z", createdAt: "2026-10-12T03:00:00.000Z" };

beforeEach(() => sessionStorage.clear());
afterEach(() => jest.restoreAllMocks());

test("保留注文のみを保存し、トークン・連絡先と完了注文を混ぜない", () => {
  savePendingPayment({ ...pending, cardToken: "secret", mail: "private@example.com" });
  expect(readPendingPayment()).toEqual(pending);
  expect(sessionStorage.getItem(PENDING_PAYMENT_KEY)).not.toMatch(/secret|private/);
  expect(sessionStorage.getItem("cm_order_v1")).toBeNull();
});
test("保存不能は送信元へ伝える", () => {
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("full"); });
  expect(() => savePendingPayment(pending)).toThrow("full");
});
test("パラメータなしRTと再読み込みでも元の注文を復元する", () => {
  expect(getPaymentReturn("?paysys_return=paypay&result=cancel", pending).pending).toEqual(pending);
  expect(getPaymentReturn("", pending).pending).toEqual(pending);
});
test("カード成功・ERROR復帰のどちらも保存済み注文を使う", () => {
  const card = { ...pending, method: "card" };
  expect(getPaymentReturn("?paysys_return=card&result=ok&SID=O16", card).pending).toEqual(card);
  expect(getPaymentReturn("?paysys_return=card&ERROR=123", card).error).toBeTruthy();
});
test("SID不一致・方式不一致・保存欠落では照会対象を選ばない", () => {
  expect(getPaymentReturn("?SID=OTHER", pending).pending).toBeNull();
  expect(getPaymentReturn("?paysys_return=card", pending).pending).toBeNull();
  expect(getPaymentReturn("?paysys_return=paypay", null).pending).toBeNull();
  expect(getPaymentReturn("", null)).toBeNull();
});
test("壊れた保留データを復元しない", () => {
  sessionStorage.setItem(PENDING_PAYMENT_KEY, "{");
  expect(readPendingPayment()).toBeNull();
  sessionStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify({ ...pending, orderId: -1 }));
  expect(readPendingPayment()).toBeNull();
});
test("状態APIはキャッシュを使わず、注文番号と状態を検証する", async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ orderId: 42, state: "WAITING" }) });
  await expect(Api.fetchPaymentStatus(42)).resolves.toEqual({ orderId: 42, state: "WAITING" });
  expect(fetch).toHaveBeenCalledWith("/api/payments/42/status", expect.objectContaining({ cache: "no-store" }));
  fetch.mockResolvedValue({ ok: true, json: async () => ({ orderId: 43, state: "PAID" }) });
  await expect(Api.fetchPaymentStatus(42)).rejects.toThrow();
  fetch.mockResolvedValue({ ok: false });
  await expect(Api.fetchPaymentStatus(42)).rejects.toThrow();
});
