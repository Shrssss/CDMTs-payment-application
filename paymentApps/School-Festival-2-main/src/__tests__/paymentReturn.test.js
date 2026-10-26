// Paysysからの戻り・決済結果画面(#/payment/result?sid=)・タイトルの「支払いを確認できていない注文」の案内を、
// App 全体を描画して確認するテスト。注文内容と支払い状況は照合ID(SID)でバックエンドから取り直す。
global.IS_REACT_ACT_ENVIRONMENT = true;
import { act } from "react";
import { createRoot } from "react-dom/client";
import { MemoryRouter, useLocation } from "react-router";

import { App } from "../App";
import { PENDING_PAYMENTS_KEY, PENDING_PAYMENT_TTL_MS, savePendingPayment } from "../features/payment/pendingPayment";
import { ORDER_HISTORY_CONFIG } from "../constants/config";
import { Api } from "../services/apiService";

jest.mock("../services/apiService", () => ({ Api: { fetchPaymentReturnOrder: jest.fn(), fetchAllItems: jest.fn() } }));

const SID = "0123456789abcdef";
const order = (state) => ({
  orderId: 42, state, cart: { 10: 2 },
  createdAt: "2026-10-12T12:00:00", reservedAt: "2026-10-12T13:00:00",
});

let container, root, location;
function LocationProbe() {
  location = useLocation();
  return null;
}

beforeEach(() => {
  localStorage.clear(); jest.clearAllMocks();
  history.replaceState(null, "", "/");
  container = document.createElement("div"); document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount()); container.remove(); jest.restoreAllMocks();
});

const flush = () => act(async () => { await new Promise((r) => setTimeout(r, 0)); });
async function render(entry = "/") {
  await act(async () => root.render(
    <MemoryRouter initialEntries={[entry]}>
      <App />
      <LocationProbe />
    </MemoryRouter>
  ));
  await flush();
}
const savedHistory = () => JSON.parse(localStorage.getItem(ORDER_HISTORY_CONFIG.KEY) || "[]");
const pendingSids = () => JSON.parse(localStorage.getItem(PENDING_PAYMENTS_KEY) || "[]").map((p) => p.sid);
const buttonByText = (text) => Array.from(container.querySelectorAll("button")).find((b) => b.textContent.includes(text));
const text = () => container.textContent;

describe("Paysysからの戻りと決済結果画面", () => {
  test("戻りURLで開くと戻りパラメータを消して ?sid= の結果画面へ移り、支払済みなら履歴に残して保留から外す", async () => {
    savePendingPayment(SID);
    history.replaceState(null, "", `/?paysys_return=card&result=ok&return_sid=${SID}`);
    Api.fetchPaymentReturnOrder.mockResolvedValue(order("PAID"));
    await render();

    expect(window.location.search).toBe("");
    expect(location.pathname).toBe("/payment/result");
    expect(location.search).toBe(`?sid=${SID}`);
    expect(Api.fetchPaymentReturnOrder).toHaveBeenCalledTimes(1);
    expect(Api.fetchPaymentReturnOrder).toHaveBeenCalledWith(SID);
    expect(text()).toContain("決済が完了しました");
    expect(text()).toContain("42");
    expect(savedHistory()[0]).toMatchObject({ orderId: 42, itemsCart: { 10: 2 } });
    expect(pendingSids()).toEqual([]);

    await act(async () => buttonByText("番号札を表示").click());
    expect(location.pathname).toBe("/number-tag");
    expect(text()).toContain("ご注文ありがとうございます");
  });

  test("別のブラウザで戻ってきても(保留が無くても)照合IDから復元する", async () => {
    history.replaceState(null, "", `/?SID=${SID}`);
    Api.fetchPaymentReturnOrder.mockResolvedValue(order("PAID"));
    await render();
    expect(text()).toContain("決済が完了しました");
    expect(savedHistory()[0].orderId).toBe(42);
  });

  test("結果画面のURLを直接開いても(再読込)照合IDから復元する", async () => {
    Api.fetchPaymentReturnOrder.mockResolvedValue(order("PAID"));
    await render(`/payment/result?sid=${SID}`);
    expect(location.pathname).toBe("/payment/result");
    expect(text()).toContain("決済が完了しました");
  });

  test("WAITINGは確認中のまま保留を残し、再確認でPAIDになって初めて履歴へ保存する", async () => {
    savePendingPayment(SID);
    history.replaceState(null, "", `/?paysys_return=paypay&result=ok&return_sid=${SID}`);
    Api.fetchPaymentReturnOrder.mockResolvedValueOnce(order("WAITING")).mockResolvedValueOnce(order("PAID"));
    await render();
    expect(text()).toContain("決済結果を確認中");
    expect(text()).toContain("42");
    expect(text()).not.toContain("番号札を表示");
    expect(savedHistory()).toEqual([]);
    expect(pendingSids()).toEqual([SID]);

    await act(async () => buttonByText("支払い状況を再確認").click());
    await flush();
    expect(text()).toContain("決済が完了しました");
    expect(savedHistory()).toHaveLength(1);
    expect(pendingSids()).toEqual([]);
  });

  test("キャンセルで戻ってきて未払いなら、未完了の可能性を案内する", async () => {
    history.replaceState(null, "", `/?paysys_return=paypay&result=cancel&return_sid=${SID}`);
    Api.fetchPaymentReturnOrder.mockResolvedValue(order("WAITING"));
    await render();
    expect(location.search).toBe(`?sid=${SID}&incomplete=1`);
    expect(text()).toContain("決済手続きが完了していない可能性があります");
  });

  test("キャンセルで戻ってきても、先に支払済みになっていれば完了とする", async () => {
    history.replaceState(null, "", `/?paysys_return=paypay&result=cancel&return_sid=${SID}`);
    Api.fetchPaymentReturnOrder.mockResolvedValue(order("PAID"));
    await render();
    expect(text()).toContain("決済が完了しました");
  });

  test("戻りURLに照合IDが無ければ照会せず、照合できないことを案内する", async () => {
    history.replaceState(null, "", "/?paysys_return=card&result=ok");
    await render();
    expect(Api.fetchPaymentReturnOrder).not.toHaveBeenCalled();
    expect(text()).toContain("注文を照合できませんでした");
    expect(Array.from(container.querySelectorAll("button")).map((b) => b.textContent)).toContain("トップに戻る");
  });

  test("通信失敗は確認中のまま案内し、再確認で回復できる", async () => {
    Api.fetchPaymentReturnOrder.mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce(order("PAID"));
    await render(`/payment/result?sid=${SID}`);
    expect(text()).toContain("注文情報を取得できませんでした");
    await act(async () => buttonByText("支払い状況を再確認").click());
    await flush();
    expect(text()).toContain("決済が完了しました");
  });

  test("照会中のボタンは無効で多重照会しない", async () => {
    let resolve;
    Api.fetchPaymentReturnOrder.mockReturnValue(new Promise((done) => { resolve = done; }));
    await render(`/payment/result?sid=${SID}`);
    const button = buttonByText("確認しています");
    expect(button.disabled).toBe(true);
    act(() => button.click());
    expect(Api.fetchPaymentReturnOrder).toHaveBeenCalledTimes(1);
    await act(async () => resolve(order("WAITING")));
  });

  test("完了保存に失敗してもPAID表示を続け、保留を残して後から再照会できるようにする", async () => {
    savePendingPayment(SID);
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("full"); });
    Api.fetchPaymentReturnOrder.mockResolvedValue(order("PAID"));
    await render(`/payment/result?sid=${SID}`);
    expect(text()).toContain("決済が完了しました");
    expect(pendingSids()).toEqual([SID]);
  });

  test("未払いのままトップに戻ると保留を消し、タイトルで案内されない", async () => {
    savePendingPayment(SID);
    Api.fetchPaymentReturnOrder.mockResolvedValue(order("WAITING"));
    await render(`/payment/result?sid=${SID}`);
    await act(async () => buttonByText("トップに戻る").click());
    await flush();
    expect(location.pathname).toBe("/");
    expect(pendingSids()).toEqual([]);
    expect(savedHistory()).toEqual([]);
    expect(text()).not.toContain("支払いを確認できていないご注文");
  });

  test("トップに戻る直前の照会で支払済みなら注文履歴に残す", async () => {
    savePendingPayment(SID);
    Api.fetchPaymentReturnOrder.mockResolvedValueOnce(order("WAITING")).mockResolvedValueOnce(order("PAID"));
    await render(`/payment/result?sid=${SID}`);
    await act(async () => buttonByText("トップに戻る").click());
    await flush();
    expect(savedHistory().map((s) => s.orderId)).toEqual([42]);
    expect(pendingSids()).toEqual([]);
  });

  test("照会が返らなくてもトップに戻れる", async () => {
    Api.fetchPaymentReturnOrder.mockResolvedValueOnce(order("WAITING"));
    await render(`/payment/result?sid=${SID}`);
    jest.useFakeTimers();
    try {
      Api.fetchPaymentReturnOrder.mockReturnValue(new Promise(() => {}));
      let leaving;
      act(() => { leaving = buttonByText("トップに戻る").click(); });
      await act(async () => { jest.advanceTimersByTime(5000); });
      await act(async () => { await leaving; });
      expect(location.pathname).toBe("/");
    } finally {
      jest.useRealTimers();
    }
  });
});

describe("タイトル画面の「支払いを確認できていないご注文」", () => {
  test("保留中の照合IDを照会し、支払済みなら履歴に加えて案内は出さない", async () => {
    savePendingPayment(SID);
    Api.fetchPaymentReturnOrder.mockResolvedValue(order("PAID"));
    await render();
    expect(text()).not.toContain("支払いを確認できていないご注文");
    expect(text()).toContain("これまでのご注文");
    expect(text()).toContain("注文番号 42");
    expect(pendingSids()).toEqual([]);
  });

  test("未払いなら案内を出し、ボタンでその注文の結果画面を開く", async () => {
    savePendingPayment(SID);
    Api.fetchPaymentReturnOrder.mockResolvedValue(order("WAITING"));
    await render();
    expect(text()).toContain("支払いを確認できていないご注文があります");
    await act(async () => buttonByText("注文番号 42 の支払い状況を確認").click());
    await flush();
    expect(location.pathname).toBe("/payment/result");
    expect(location.search).toBe(`?sid=${SID}`);
    expect(text()).toContain("決済結果を確認中");
  });

  test("照会に失敗しても案内に残す", async () => {
    savePendingPayment(SID);
    Api.fetchPaymentReturnOrder.mockRejectedValue(new Error("offline"));
    await render();
    expect(buttonByText("ご注文の支払い状況を確認")).toBeDefined();
  });

  test("期限切れの照合IDは照会しない", async () => {
    savePendingPayment(SID, new Date(Date.now() - PENDING_PAYMENT_TTL_MS - 1000));
    await render();
    expect(Api.fetchPaymentReturnOrder).not.toHaveBeenCalled();
    expect(localStorage.getItem(PENDING_PAYMENTS_KEY)).toBeNull();
  });

  test("戻りURLで開いた直後はタイトルでは照会せず、結果画面の1回だけにする", async () => {
    savePendingPayment(SID);
    history.replaceState(null, "", `/?paysys_return=card&result=ok&return_sid=${SID}`);
    Api.fetchPaymentReturnOrder.mockResolvedValue(order("WAITING"));
    await render();
    expect(Api.fetchPaymentReturnOrder).toHaveBeenCalledTimes(1);
  });
});
