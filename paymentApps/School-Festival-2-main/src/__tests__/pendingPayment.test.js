import {
  savePendingPayment, readPendingPayments, removePendingPayment, readPaymentReturnParams, canSavePendingPayment,
  PENDING_PAYMENTS_KEY, PENDING_PAYMENT_TTL_MS,
} from "../features/payment/pendingPayment";
import { Api } from "../services/apiService";

const SID_A = "0123456789abcdef";
const SID_B = "fedcba9876543210";
const NOW = new Date("2026-10-12T03:00:00.000Z");
const later = (ms) => new Date(NOW.getTime() + ms);

beforeEach(() => localStorage.clear());
afterEach(() => jest.restoreAllMocks());

test("照合IDと保存時刻だけを localStorage に保存し、新しい順に読み出す", () => {
  savePendingPayment(SID_A, NOW);
  savePendingPayment(SID_B, later(1000));
  expect(readPendingPayments(later(2000))).toEqual([
    { sid: SID_B, savedAt: later(1000).toISOString() },
    { sid: SID_A, savedAt: NOW.toISOString() },
  ]);
  expect(Object.keys(JSON.parse(localStorage.getItem(PENDING_PAYMENTS_KEY))[0])).toEqual(["sid", "savedAt"]);
});

test("同じ照合IDを保存し直すと1件にまとめ、保存時刻を更新する", () => {
  savePendingPayment(SID_A, NOW);
  savePendingPayment(SID_A, later(1000));
  expect(readPendingPayments(later(2000))).toEqual([{ sid: SID_A, savedAt: later(1000).toISOString() }]);
});

test("期限切れは読み出し時に捨て、ストレージからも消す", () => {
  savePendingPayment(SID_A, NOW);
  savePendingPayment(SID_B, later(PENDING_PAYMENT_TTL_MS / 2));
  expect(readPendingPayments(later(PENDING_PAYMENT_TTL_MS)).map((p) => p.sid)).toEqual([SID_B]);
  expect(localStorage.getItem(PENDING_PAYMENTS_KEY)).not.toContain(SID_A);
});

test("removePendingPayment で指定した照合IDだけ消し、空になればキーごと消す", () => {
  // removePendingPayment は実際の現在時刻で期限を判定するため、ここでは現在時刻で保存する。
  savePendingPayment(SID_A);
  savePendingPayment(SID_B);
  removePendingPayment(SID_A);
  expect(readPendingPayments().map((p) => p.sid)).toEqual([SID_B]);
  removePendingPayment(SID_B);
  expect(localStorage.getItem(PENDING_PAYMENTS_KEY)).toBeNull();
});

test("不正な照合IDは保存しない・壊れた値は読み飛ばす", () => {
  expect(() => savePendingPayment("O16", NOW)).toThrow();
  localStorage.setItem(PENDING_PAYMENTS_KEY, "{");
  expect(readPendingPayments(NOW)).toEqual([]);
  localStorage.setItem(PENDING_PAYMENTS_KEY, JSON.stringify([{ sid: "bad", savedAt: NOW.toISOString() }, { sid: SID_A }]));
  expect(readPendingPayments(NOW)).toEqual([]);
});

test("書き込めるかどうかを確かめ、確認用の値は残さない", () => {
  expect(canSavePendingPayment()).toBe(true);
  expect(localStorage.length).toBe(0);
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("blocked"); });
  expect(canSavePendingPayment()).toBe(false);
});

test("保存不能は送信元へ伝える(呼び出し側は外部決済へ送り出さない)", () => {
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("full"); });
  expect(() => savePendingPayment(SID_A, NOW)).toThrow("full");
});

test("戻りURLから照合IDと未完了かどうかを読む", () => {
  expect(readPaymentReturnParams(`?paysys_return=card&result=ok&return_sid=${SID_A}`)).toEqual({ sid: SID_A, incomplete: false });
  expect(readPaymentReturnParams(`?paysys_return=paypay&result=cancel&return_sid=${SID_A}`)).toEqual({ sid: SID_A, incomplete: true });
  // 決済会社が独自パラメータを落としても SID で受け付ける
  expect(readPaymentReturnParams(`?SID=${SID_B}&ERROR=123`)).toEqual({ sid: SID_B, incomplete: true });
  // return_sid が不正なら SID を使う
  expect(readPaymentReturnParams(`?return_sid=bad&SID=${SID_B}`)).toEqual({ sid: SID_B, incomplete: false });
  expect(readPaymentReturnParams("?paysys_return=card")).toEqual({ sid: null, incomplete: false });
  expect(readPaymentReturnParams("")).toBeNull();
  expect(readPaymentReturnParams("?utm_source=x")).toBeNull();
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
