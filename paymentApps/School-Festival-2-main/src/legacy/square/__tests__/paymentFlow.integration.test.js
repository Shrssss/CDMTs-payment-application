// ⚠️ 未使用(Square廃止に伴い隔離)
// 本番相当の支払いフローを、注文作成からSquare決済完了まで通して確認する統合テスト。
import { Api } from "../../../services/apiService";
import { createPaymentOrder } from "../../../features/payment/paymentSession";
import { initializePaymentScreen } from "../features/payment/paymentScreen";
import {
  ensurePaymentCardMounted,
  submitPaymentTransaction,
} from "../features/payment/paymentGateway";
import { toLocalDateTimeString } from "../../../utils/dateFormat";

describe("paymentFlow integration", () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    document.body.innerHTML = "";
    delete window.Square;
    jest.clearAllMocks();
  });

  test("completes the real payment flow when backend config and Square SDK are available", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: { get: jest.fn().mockReturnValue("application/json") },
      json: jest.fn().mockResolvedValue({
        applicationId: "sq0idp-live-123",
        locationId: "loc-123",
        environment: "PRODUCTION",
      }),
    });

    // backend は素の Long(orderId)を返す実装のため、モックも bare な値を返す。
    const createOrder = jest.fn().mockResolvedValue("ORDER-1001");
    const loadSquareSdk = jest.fn().mockResolvedValue(undefined);
    const setPaymentState = jest.fn();
    const destroyCardIfAny = jest.fn().mockResolvedValue(undefined);
    const chargeOrder = jest
      .fn()
      .mockResolvedValue({ status: "APPROVED", receiptUrl: "https://example.com/receipt" });

    const card = {
      attach: jest.fn().mockResolvedValue(undefined),
      tokenize: jest.fn().mockResolvedValue({ status: "OK", token: "tok-123" }),
      destroy: jest.fn().mockResolvedValue(undefined),
    };

    window.Square = {
      payments: jest.fn().mockReturnValue({
        card: jest.fn().mockResolvedValue(card),
      }),
    };

    document.body.innerHTML = '<div id="card-container"></div>';

    const orderSession = await createPaymentOrder({
      cart: { 10: 1, 20: 0, 30: 0, 40: 0, 50: 0, 91: 0, 92: 0, 93: 0, 94: 0 },
      selectedTime: "2026-07-02T13:00:00.000Z",
      calculateSumPrice: () => 470,
      useMockPayment: false,
      createOrder,
      createdAtIso: "2026-07-02T12:00:00.000Z",
    });

    expect(createOrder).toHaveBeenCalledWith({
      items: [{ itemId: 10, quantity: 1 }],
      drinkCounts: {},
      orderDate: toLocalDateTimeString("2026-07-02T12:00:00.000Z"),
      reservedTime: toLocalDateTimeString("2026-07-02T13:00:00.000Z"),
    });
    expect(orderSession.orderId).toBe("ORDER-1001");

    const cfg = await initializePaymentScreen({
      getSquareConfig: Api.getSquareConfig,
      loadSquareSdk,
      setPaymentState,
      useMockPayment: false,
    });

    expect(cfg).toEqual({
      applicationId: "sq0idp-live-123",
      locationId: "loc-123",
      environment: "PRODUCTION",
    });
    expect(loadSquareSdk).toHaveBeenCalledWith("PRODUCTION");

    const cardRef = { current: null };
    await ensurePaymentCardMounted({
      cardRef,
      setPaymentState,
      destroyCardIfAny,
      applicationId: cfg.applicationId,
      locationId: cfg.locationId,
    });

    expect(window.Square.payments).toHaveBeenCalledWith("sq0idp-live-123", "loc-123");
    expect(cardRef.current).toBe(card);
    expect(setPaymentState).toHaveBeenCalledWith(expect.any(Function));

    const result = await submitPaymentTransaction({
      orderId: orderSession.orderId,
      amount: orderSession.amount,
      billingInfo: {
        familyName: "山田",
        givenName: "太郎",
        email: "taro@example.com",
      },
      useMockPayment: false,
      cardRef,
      getSquareConfig: Api.getSquareConfig,
      loadSquareSdk,
      ensurePaymentCardMounted,
      chargeOrder,
      buildVerificationDetails: jest.requireActual("../features/payment/paymentValidation").buildVerificationDetails,
    });

    expect(card.tokenize).toHaveBeenCalled();
    expect(chargeOrder).toHaveBeenCalledWith({
      orderId: "ORDER-1001",
      sourceId: "tok-123",
    });
    expect(result).toEqual({
      status: "APPROVED",
      receiptUrl: "https://example.com/receipt",
    });
  });
});
