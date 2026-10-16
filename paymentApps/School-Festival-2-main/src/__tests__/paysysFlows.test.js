global.IS_REACT_ACT_ENVIRONMENT = true;
import { act } from "react";
import { createRoot } from "react-dom/client";
import { useCardPaymentFlow } from "../hooks/useCardPaymentFlow";
import { usePayPayPaymentFlow } from "../hooks/usePayPayPaymentFlow";
import { Api } from "../services/apiService";
import { submitPaymentForm } from "../features/payment/submitPaymentForm";
import { readPendingPayment } from "../features/payment/pendingPayment";

jest.mock("../constants/config", () => ({ USE_MOCK_PAYMENT: false }));
jest.mock("../hooks/useMockPaymentFlow", () => ({ useMockPaymentFlow: () => ({ handlePay: jest.fn(), submitting: false }) }));
jest.mock("../services/apiService", () => ({ Api: {
  createOrder: jest.fn(), prepareCardPayment: jest.fn(), preparePayPayPayment: jest.fn(),
  chargeOrder: jest.fn(), getSquareConfig: jest.fn(),
} }));
jest.mock("../features/payment/submitPaymentForm", () => ({ submitPaymentForm: jest.fn() }));

let container, root, flow;
const prepared = { orderId: 42, sid: "O16", action: "https://example.invalid/pay", fields: {} };
const cart = { 10: 1 };
function Harness({ method, cart: harnessCart = cart }) {
  const props = { cart: harnessCart, selectedTime: "2026-10-12T13:00:00+09:00", dispatch: jest.fn(), setPaymentState: jest.fn() };
  const card = useCardPaymentFlow({ ...props, email: "test@example.com" });
  const paypay = usePayPayPaymentFlow(props);
  flow = method === "card" ? card.handlePayWithCard : paypay.handlePayWithPayPay;
  return null;
}
beforeEach(() => {
  jest.clearAllMocks(); sessionStorage.clear();
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
  Api.createOrder.mockResolvedValue(42);
  Api.prepareCardPayment.mockResolvedValue(prepared); Api.preparePayPayPayment.mockResolvedValue(prepared);
  jest.spyOn(window, "alert").mockImplementation(() => {});
  window.metapspayment = { setRequireName: jest.fn(), setRequireCsc: jest.fn(),
    createTokenWin: jest.fn(callback => callback(201, { id: "1234567890123456" })) };
});
afterEach(() => { act(() => root.unmount()); container.remove(); jest.restoreAllMocks(); delete window.metapspayment; });

test.each(["card", "paypay"])("%sは実注文→準備→保存→POSTの順でSquareを呼ばない", async method => {
  submitPaymentForm.mockImplementation(() => {
    expect(readPendingPayment()).toMatchObject({ orderId: 42, sid: "O16", method, cart });
  });
  await act(async () => root.render(<Harness method={method} />));
  await act(async () => flow());
  expect(Api.createOrder).toHaveBeenCalledWith(expect.objectContaining({ paymentStatus: false, servingStatus: 0 }));
  expect(submitPaymentForm).toHaveBeenCalledWith(prepared);
  if (method === "card") expect(Api.prepareCardPayment).toHaveBeenCalledWith({ orderId: 42, cardToken: "1234567890123456", mail: "test@example.com" });
  else expect(Api.preparePayPayPayment).toHaveBeenCalledWith({ orderId: 42 });
  expect(Api.chargeOrder).not.toHaveBeenCalled(); expect(Api.getSquareConfig).not.toHaveBeenCalled();
});
test.each(["card", "paypay"])("%sは保留保存不能時に外部POSTしない", async method => {
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("full"); });
  await act(async () => root.render(<Harness method={method} />));
  await act(async () => flow());
  expect(submitPaymentForm).not.toHaveBeenCalled();
  expect(window.alert).toHaveBeenCalled();
});
test.each(["card", "paypay"])("%sは商品とドリンク種別ごとの本数を両方送る(割り振りはバックエンド)", async method => {
  // 角煮ドリンクセット1 + ドリンク単品1、コーラ1・オレンジ1
  const drinkCart = { 30: 1, 40: 1, 91: 1, 92: 1 };
  await act(async () => root.render(<Harness method={method} cart={drinkCart} />));
  await act(async () => flow());
  expect(Api.createOrder).toHaveBeenCalledWith(expect.objectContaining({
    items: [{ itemId: 30, quantity: 1 }, { itemId: 40, quantity: 1 }],
    drinkCounts: { 91: 1, 92: 1 },
  }));
});
