// ⚠️ 未使用(Square廃止に伴い隔離。importしないこと)
// Square カードの初期化とトークン化、実際の支払い送信をまとめるロジック。
import { MOCK_CARD_PAYMENT_RESULT } from "../../constants/mocks/cardPaymentMock";

export async function ensurePaymentCardMounted({
  cardRef,
  setPaymentState,
  destroyCardIfAny,
  applicationId,
  locationId,
}) {
  function waitForContainer(timeoutMs = 8000, intervalMs = 50) {
    const start = Date.now();
    return new Promise((resolve) => {
      const check = () => {
        const el = document.getElementById("card-container");
        if (el) return resolve(el);
        if (Date.now() - start >= timeoutMs) return resolve(null);
        setTimeout(check, intervalMs);
      };
      check();
    });
  }

  async function tryAttach(card, selector = "#card-container", tries = 4, delayMs = 300) {
    for (let i = 0; i < tries; i++) {
      try {
        await card.attach(selector);
        console.log("DEBUG: card.attach succeeded (attempt)", i + 1);
        return true;
      } catch (e) {
        console.warn("DEBUG: card.attach attempt failed", i + 1, e);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
    return false;
  }

  if (!window.Square) throw new Error("Square SDKが読み込まれていません");

  const container = await waitForContainer();
  if (!container) {
    throw new Error("#card-container が見つかりません（タイムアウト）。");
  }

  if (cardRef.current && container.childElementCount === 0) {
    try {
      const ok = await tryAttach(cardRef.current, "#card-container");
      if (ok) {
        setPaymentState((prev) => ({ ...prev, cardAttached: true }));
        return;
      }
      await destroyCardIfAny();
    } catch (e) {
      await destroyCardIfAny();
    }
  }

  if (!cardRef.current) {
    let payments;
    try {
      payments = window.Square.payments(applicationId, locationId);
    } catch (e) {
      throw new Error("Square.payments の初期化に失敗: " + (e?.message || e));
    }

    const card = await payments.card();

    const attached = await tryAttach(card, "#card-container");
    if (!attached) {
      try {
        await card.destroy?.();
      } catch {
      }
      throw new Error("カードUIの attach に失敗しました（複数回リトライしてもダメでした）。");
    }

    cardRef.current = card;
    setPaymentState((prev) => ({ ...prev, cardAttached: true }));
    return;
  }

  if (cardRef.current && container.childElementCount > 0) {
    setPaymentState((prev) => ({ ...prev, cardAttached: true }));
  }
}

export async function submitPaymentTransaction({
  orderId,
  amount,
  billingInfo,
  useMockPayment,
  cardRef,
  getSquareConfig,
  loadSquareSdk,
  ensurePaymentCardMounted,
  chargeOrder,
  buildVerificationDetails,
}) {
  if (
    !billingInfo.familyName.trim() ||
    !billingInfo.givenName.trim() ||
    !billingInfo.email.trim()
  ) {
    throw new Error("氏名とメールアドレスを入力してください。");
  }

  const verificationDetails = buildVerificationDetails(amount, billingInfo);

  if (useMockPayment) {
    if (!cardRef.current) {
      const cfg = await getSquareConfig({ useMockPayment });
      await loadSquareSdk(cfg?.environment || "PRODUCTION");
      await ensurePaymentCardMounted(cfg);
      if (!cardRef.current) throw new Error("カードUIの初期化に失敗しました");
    }

    const result = await cardRef.current.tokenize(verificationDetails);

    if (result.status !== "OK") {
      const msg = result.errors?.[0]?.message || "カードのトークン化に失敗しました";
      throw new Error(msg);
    }

    await new Promise((r) => setTimeout(r, 300));
    return MOCK_CARD_PAYMENT_RESULT;
  }

  if (!cardRef.current) {
    const cfg = await getSquareConfig({ useMockPayment });
    await loadSquareSdk(cfg?.environment || "PRODUCTION");
    await ensurePaymentCardMounted(cfg);
    if (!cardRef.current) throw new Error("カードUIの初期化に失敗しました");
  }

  const result = await cardRef.current.tokenize(verificationDetails);

  if (result.status !== "OK") {
    const msg = result.errors?.[0]?.message || "カードのトークン化に失敗しました";
    throw new Error(msg);
  }

  return chargeOrder({
    orderId,
    sourceId: result.token,
  });
}