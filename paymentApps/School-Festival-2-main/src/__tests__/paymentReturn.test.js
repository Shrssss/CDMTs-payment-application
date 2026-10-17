global.IS_REACT_ACT_ENVIRONMENT = true;
import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { usePaymentReturn } from "../hooks/usePaymentReturn";
import { PaymentResultPage } from "../pages/PaymentResultPage";
import { TestAppProvider } from "../test-utils/appContext";
import { savePendingPayment, PENDING_PAYMENT_KEY } from "../features/payment/pendingPayment";
import { ORDER_HISTORY_CONFIG } from "../constants/config";
import { Api } from "../services/apiService";

jest.mock("../services/apiService", () => ({ Api: { fetchPaymentStatus: jest.fn(), fetchPaymentReturnOrder: jest.fn() } }));
const pending = { orderId: 42, sid: "O16", method: "paypay", cart: { 10: 2 },
  reservedAtIso: "2026-10-12T04:00:00.000Z", createdAt: "2026-10-12T03:00:00.000Z" };
let container, root, dispatch, goto, setSelectedTime;
function Harness() {
  const [paymentState, setPaymentState] = useState({ outcome: { ok: false } });
  const { refreshPaymentStatus, leavePaymentResult, checking } = usePaymentReturn({ dispatch, goto, setPaymentState, setSelectedTime });
  return (
    <TestAppProvider value={{ paymentState, setPaymentState, goto, refreshPaymentStatus,
      leavePaymentResult, checkingPaymentStatus: checking }}>
      <PaymentResultPage />
    </TestAppProvider>
  );
}
beforeEach(() => {
  sessionStorage.clear(); localStorage.clear(); jest.clearAllMocks();
  history.replaceState(null, "", "/?paysys_return=paypay&result=ok&SID=O16");
  savePendingPayment(pending);
  container = document.createElement("div"); document.body.appendChild(container);
  root = createRoot(container); dispatch = jest.fn(); goto = jest.fn(); setSelectedTime = jest.fn();
});
afterEach(() => {
  act(() => root.unmount()); container.remove(); jest.restoreAllMocks();
});
async function render() { await act(async () => root.render(<Harness />)); }
const savedHistory = () => JSON.parse(localStorage.getItem(ORDER_HISTORY_CONFIG.KEY) || "[]");
const buttonByText = text => Array.from(container.querySelectorAll("button")).find(b => b.textContent === text);

test("別ブラウザの復帰でも照合IDから注文を復元し、決済済みなら履歴に保存する", async () => {
  sessionStorage.clear();
  history.replaceState(null, "", "/?paysys_return=paypay&result=ok&return_sid=0123456789abcdef");
  Api.fetchPaymentReturnOrder.mockResolvedValue({
    orderId: 42, state: "PAID", cart: { 10: 2 },
    createdAt: "2026-10-12T12:00:00", reservedAt: "2026-10-12T13:00:00",
  });
  Api.fetchPaymentStatus.mockResolvedValue({ orderId: 42, state: "PAID" });
  await render();
  expect(Api.fetchPaymentReturnOrder).toHaveBeenCalledWith("0123456789abcdef");
  expect(container.textContent).toContain("決済が完了しました");
  expect(savedHistory()[0]).toMatchObject({ orderId: 42, itemsCart: { 10: 2 } });
  expect(location.search).toBe("");
});

test("決済会社が独自の戻りパラメータを落としてもSIDから復元する", async () => {
  sessionStorage.clear();
  history.replaceState(null, "", "/?SID=0123456789abcdef");
  Api.fetchPaymentReturnOrder.mockResolvedValue({
    orderId: 42, state: "PAID", cart: { 10: 2 },
    createdAt: "2026-10-12T12:00:00", reservedAt: "2026-10-12T13:00:00",
  });
  Api.fetchPaymentStatus.mockResolvedValue({ orderId: 42, state: "PAID" });
  await render();
  expect(Api.fetchPaymentReturnOrder).toHaveBeenCalledWith("0123456789abcdef");
  expect(savedHistory()[0].orderId).toBe(42);
});

test("成功URLでもWAITINGは未完了、手動再取得でPAIDになって初めて保存と番号札へ進む", async () => {
  Api.fetchPaymentStatus.mockResolvedValueOnce({ state: "WAITING" }).mockResolvedValueOnce({ state: "PAID" });
  await render();
  expect(container.textContent).toContain("決済結果を確認中");
  expect(container.textContent).not.toContain("再試行");
  expect(container.textContent).not.toContain("番号札を表示");
  expect(savedHistory()).toEqual([]);
  expect(dispatch).toHaveBeenCalledWith({ type: "REPLACE_CART", cart: pending.cart });
  expect(setSelectedTime).toHaveBeenCalledWith(pending.reservedAtIso);
  expect(goto).toHaveBeenCalledWith("paymentResult", { replace: true });
  await act(async () => container.querySelector("button").click());
  expect(container.textContent).toContain("決済が完了しました");
  expect(container.textContent).toContain("42");
  expect(savedHistory()).toHaveLength(1);
  expect(savedHistory()[0]).toMatchObject({ orderId: 42, itemsCart: pending.cart, reservedAtIso: pending.reservedAtIso });
  expect(sessionStorage.getItem(PENDING_PAYMENT_KEY)).toBeNull();
  expect(location.search).toBe("");
  act(() => container.querySelector("button").click());
  expect(goto).toHaveBeenCalledWith("numberTag");
});
test("通信失敗は待機を維持し、再取得で回復できる", async () => {
  Api.fetchPaymentStatus.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ state: "PAID" });
  await render();
  expect(container.textContent).toContain("決済状況を取得できませんでした");
  expect(sessionStorage.getItem(PENDING_PAYMENT_KEY)).not.toBeNull();
  await act(async () => container.querySelector("button").click());
  expect(container.textContent).toContain("決済が完了しました");
});
test("中止復帰でも先に届いた支払済み通知を優先する", async () => {
  history.replaceState(null, "", "/?paysys_return=paypay&result=cancel");
  Api.fetchPaymentStatus.mockResolvedValue({ state: "PAID" });
  await render();
  expect(container.textContent).toContain("決済が完了しました");
});
test("保存欠落時は照会・再決済を案内しない", async () => {
  sessionStorage.clear(); await render();
  expect(Api.fetchPaymentStatus).not.toHaveBeenCalled();
  expect(container.textContent).toContain("元の注文を復元できません");
  expect(Array.from(container.querySelectorAll("button")).map(b => b.textContent)).toEqual(["トップに戻る"]);
});
test("完了保存に失敗してもPAID表示と保留注文を維持する", async () => {
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("full"); });
  Api.fetchPaymentStatus.mockResolvedValue({ state: "PAID" }); await render();
  expect(container.textContent).toContain("決済が完了しました");
  expect(sessionStorage.getItem(PENDING_PAYMENT_KEY)).not.toBeNull();
});
test("照会中のボタンは無効で多重照会しない", async () => {
  let resolve;
  Api.fetchPaymentStatus.mockReturnValue(new Promise(done => { resolve = done; }));
  await render();
  expect(container.querySelector("button").disabled).toBe(true);
  act(() => container.querySelector("button").click());
  expect(Api.fetchPaymentStatus).toHaveBeenCalledTimes(1);
  await act(async () => resolve({ state: "WAITING" }));
});
test("PAIDでの保存は既存の注文履歴を上書きせず先頭に追加する", async () => {
  localStorage.setItem(ORDER_HISTORY_CONFIG.KEY, JSON.stringify([{ createdAt: "2026-10-11T03:00:00.000Z",
    reservedAtIso: "2026-10-11T04:00:00.000Z", orderId: 7, itemsCart: { 20: 1 }, displayReserved: "x" }]));
  Api.fetchPaymentStatus.mockResolvedValue({ state: "PAID" }); await render();
  expect(savedHistory().map(s => s.orderId)).toEqual([42, 7]);
});
test("キャンセル復帰で未払いのままでも、トップに戻れば保留注文と戻りURLが消えて再読込で結果画面に戻らない", async () => {
  history.replaceState(null, "", "/?paysys_return=paypay&result=cancel");
  Api.fetchPaymentStatus.mockResolvedValue({ state: "WAITING" });
  await render();
  expect(container.textContent).toContain("決済結果を確認中");
  await act(async () => buttonByText("トップに戻る").click());
  expect(sessionStorage.getItem(PENDING_PAYMENT_KEY)).toBeNull();
  expect(location.search).toBe("");
  expect(savedHistory()).toEqual([]);
  expect(dispatch).toHaveBeenCalledWith({ type: "RESET_CART" });
  expect(goto).toHaveBeenCalledWith("title");
  // 同じタブで開き直しても、もう決済結果画面へは飛ばない
  act(() => root.unmount()); root = createRoot(container); goto.mockClear();
  await render();
  expect(goto).not.toHaveBeenCalledWith("paymentResult", expect.anything());
});
test("トップに戻る直前の照会で支払済みなら注文履歴に残す", async () => {
  Api.fetchPaymentStatus.mockResolvedValueOnce({ state: "WAITING" }).mockResolvedValueOnce({ state: "PAID" });
  await render();
  await act(async () => buttonByText("トップに戻る").click());
  expect(savedHistory().map(s => s.orderId)).toEqual([42]);
  expect(sessionStorage.getItem(PENDING_PAYMENT_KEY)).toBeNull();
});
test("照会中で応答が返らなくてもトップに戻れる", async () => {
  jest.useFakeTimers();
  try {
    Api.fetchPaymentStatus.mockReturnValue(new Promise(() => {}));
    await render();
    let leaving;
    act(() => { leaving = buttonByText("トップに戻る").click(); });
    await act(async () => { jest.advanceTimersByTime(5000); });
    await act(async () => { await leaving; });
    expect(goto).toHaveBeenCalledWith("title");
    expect(sessionStorage.getItem(PENDING_PAYMENT_KEY)).toBeNull();
  } finally {
    jest.useRealTimers();
  }
});
