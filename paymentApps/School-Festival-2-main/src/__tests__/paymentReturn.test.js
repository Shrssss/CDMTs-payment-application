global.IS_REACT_ACT_ENVIRONMENT = true;
import { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { usePaymentReturn } from "../hooks/usePaymentReturn";
import { PaymentResultPage } from "../pages/PaymentResultPage";
import { savePendingPayment, PENDING_PAYMENT_KEY } from "../features/payment/pendingPayment";
import { Api } from "../services/apiService";

jest.mock("../services/apiService", () => ({ Api: { fetchPaymentStatus: jest.fn() } }));
const pending = { orderId: 42, sid: "O16", method: "paypay", cart: { 10: 2 },
  reservedAtIso: "2026-10-12T04:00:00.000Z", createdAt: "2026-10-12T03:00:00.000Z" };
let container, root, dispatch, setSelectedTime;
function Harness() {
  const [paymentState, setPaymentState] = useState({ outcome: { ok: false } });
  const { refreshPaymentStatus, checking } = usePaymentReturn({ dispatch, setPaymentState, setSelectedTime });
  return <PaymentResultPage paymentState={paymentState} setPaymentState={setPaymentState} dispatch={dispatch}
    onRefreshPaymentStatus={refreshPaymentStatus} checkingPaymentStatus={checking} />;
}
beforeEach(() => {
  sessionStorage.clear(); localStorage.clear(); jest.clearAllMocks();
  history.replaceState(null, "", "/?paysys_return=paypay&result=ok&SID=O16");
  savePendingPayment(pending);
  container = document.createElement("div"); document.body.appendChild(container);
  root = createRoot(container); dispatch = jest.fn(); setSelectedTime = jest.fn();
});
afterEach(() => {
  act(() => root.unmount()); container.remove(); jest.restoreAllMocks();
});
async function render() { await act(async () => root.render(<Harness />)); }

test("成功URLでもWAITINGは未完了、手動再取得でPAIDになって初めて保存と番号札へ進む", async () => {
  Api.fetchPaymentStatus.mockResolvedValueOnce({ state: "WAITING" }).mockResolvedValueOnce({ state: "PAID" });
  await render();
  expect(container.textContent).toContain("決済結果を確認中");
  expect(container.textContent).not.toContain("再試行");
  expect(container.textContent).not.toContain("番号札を表示");
  expect(localStorage.getItem("cm_order_v1")).toBeNull();
  expect(dispatch).toHaveBeenCalledWith({ type: "REPLACE_CART", cart: pending.cart });
  expect(setSelectedTime).toHaveBeenCalledWith(pending.reservedAtIso);
  await act(async () => container.querySelector("button").click());
  expect(container.textContent).toContain("決済が完了しました");
  expect(container.textContent).toContain("42");
  expect(JSON.parse(localStorage.getItem("cm_order_v1"))).toMatchObject({ orderId: 42, itemsCart: pending.cart, reservedAtIso: pending.reservedAtIso });
  expect(sessionStorage.getItem(PENDING_PAYMENT_KEY)).toBeNull();
  expect(location.search).toBe("");
  act(() => container.querySelector("button").click());
  expect(dispatch).toHaveBeenCalledWith({ type: "GOTO", step: "numberTag" });
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
  expect(container.querySelector("button")).toBeNull();
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
