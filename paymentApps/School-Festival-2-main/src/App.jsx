import "./styles.css";
import { useState, useEffect, useRef } from "react";

import { useReducer } from "react";
import { Header } from "./components/Header";
import { Title } from "./components/Title";
import { Menu } from "./components/Menu";
import { Order } from "./components/Order";
import { Footer } from "./components/Footer";
import { TimeSelect } from "./components/TimeSelect";
import { loadSquareSdk } from "./squarePayments";
import { Api } from "./api";
import {
  buildOrderItems,
  formatReservedTimeHHmm,
  parseReservedToDate,
} from "./orderUtils";
import {
  setCookieJSON,
  getCookieJSON,
  setCookieStr,
  getCookieStr,
  deleteCookie,
  getCookieJSON as getCookieJSONAlias, // not used but keep for clarity
} from "./cookies";

import testImg from "../src/image/testImg.jpg";
import img_10 from "../src/image/img_10.jpg";
import img_20 from "../src/image/img_20.jpg";
import img_30 from "../src/image/img_30.jpg";
import img_40 from "../src/image/img_40.jpg";
import img_50 from "../src/image/img_50.jpg";

// ブラウザコンソールで Api.getSquareConfig() を叩けるようにする
//WARNING:テストの後は消す
window.Api = Api;

// バック連携前用のMOCKスイッチ
//＜WARNING:本番は必ずfalseにすること＞
const USE_MOCK_PAYMENT = false;

// ------ 変数や定数 ------

const steps = [
  "title",
  "menu",
  "drink",
  "cart",
  "time",
  "payment",
  "paymentResult",
  "numberTag",
];

//値段
const prices = {
  10: 420,
  20: 620,
  30: 150,
  40: 520,
  50: 720,
};

const itemNames = {
  10: "角煮 単品",
  20: "角煮大盛り 単品",
  30: "ドリンク 単品",
  40: "【お得】角煮ドリンクセット",
  50: "【お得】角煮ドリンクセット大盛り",
  91: "コーラ",
  92: "なっちゃんオレンジ",
  93: "三ツ矢サイダー",
  94: "烏龍茶",
};

const isSoldout = {
  10: false,
  20: false,
  30: false,
  40: false,
  50: false,
  91: false,
  92: false,
  93: false,
  94: false,
};

//初期値
const initialState = {
  step: "title",
  cart: {
    //以下は内部処理のみに使う商品ID
    91: 0,
    92: 0,
    93: 0,
    94: 0,
    30: 0,
    40: 0,
    50: 0,

    //以下は実際に存在する商品ID
    10: 0,
    20: 0,
    31: 0,
    32: 0,
    33: 0,
    34: 0,
    41: 0,
    42: 0,
    43: 0,
    44: 0,
    51: 0,
    52: 0,
    53: 0,
    54: 0,
  },
};

//テスト時にSOLDOUT判定にしないための日付
const testDate = new Date(2025, 8, 22, 12, 0, 0);

// helper: format Date -> "yyyy-MM-dd'T'HH:mm:ss" (LocalDateTime style, no Z)
function toLocalDateTimeString(d) {
  const D = new Date(d);
  const p = (n) => String(n).padStart(2, "0");
  return `${D.getFullYear()}-${p(D.getMonth() + 1)}-${p(D.getDate())}T${p(
    D.getHours()
  )}:${p(D.getMinutes())}:${p(D.getSeconds())}`;
}

// helper: display-friendly reserved datetime "YYYY-MM-DD HH:mm"
function formatDisplayReserved(d) {
  const D = new Date(d);
  const p = (n) => String(n).padStart(2, "0");
  return `${D.getFullYear()}-${p(D.getMonth() + 1)}-${p(D.getDate())} ${p(
    D.getHours()
  )}:${p(D.getMinutes())}`;
}

// ------ ScreenStateの動作定義 ------
const screenState = (state, action) => {
  switch (action.type) {
    case "GOTO":
      if (!steps.includes(action.step)) return state;
      return { ...state, step: action.step };
    case "NEXT": {
      const currentIndex = steps.indexOf(state.step);
      if (currentIndex === -1) return state;
      if (currentIndex < steps.length - 1) {
        const nextStep = steps[currentIndex + 1];
        return { ...state, step: nextStep };
      }
      return state;
    }
    case "PREV": {
      const currentIndex = steps.indexOf(state.step);
      if (currentIndex === -1) return state;
      if (currentIndex > 0) {
        const prevStep = steps[currentIndex - 1];
        return { ...state, step: prevStep };
      }
      return state;
    }
    case "ADD_ITEM": {
      const { itemId } = action;
      const currentCount = state.cart[itemId] || 0;
      return {
        ...state,
        cart: {
          ...state.cart,
          [itemId]: currentCount + 1,
        },
      };
    }
    case "REMOVE_ITEM": {
      const { itemId } = action;
      const currentCount = state.cart[itemId] || 0;
      if (currentCount > 0) {
        return {
          ...state,
          cart: {
            ...state.cart,
            [itemId]: currentCount - 1,
          },
        };
      }
      return state;
    }
    case "ADD_DRINK": {
      const { itemId } = action;
      const currentCount = state.cart[itemId] || 0;
      return {
        ...state,
        cart: {
          ...state.cart,
          [itemId]: currentCount + 1,
        },
      };
    }
    case "REMOVE_DRINK": {
      const { itemId } = action;
      const currentCount = state.cart[itemId] || 0;
      if (currentCount > 0) {
        return {
          ...state,
          cart: {
            ...state.cart,
            [itemId]: currentCount - 1,
          },
        };
      }
      return state;
    }
    case "CLEAR_TEMPORARY_DRINKS": {
      const newCart = { ...state.cart };
      newCart[91] = 0;
      newCart[92] = 0;
      newCart[93] = 0;
      newCart[94] = 0;
      return { ...state, cart: newCart };
    }
    case "DELETE_TEMPORARY": {
      const newCart = { ...state.cart };
      newCart[30] = 0;
      newCart[40] = 0;
      newCart[50] = 0;
      return { ...state, cart: newCart };
    }
    case "ORGANIZE_CART": {
      const cart = state.cart;
      const newCart = { ...cart };
      let sumM = newCart[40] || 0;
      let sumL = newCart[50] || 0;
      for (let i = 31; i <= 34; i++) newCart[i] = 0;
      for (let i = 41; i <= 44; i++) newCart[i] = 0;
      for (let i = 51; i <= 54; i++) newCart[i] = 0;

      for (let d = 91; d <= 94; d++) {
        const drinkNo = d - 90; // 1..4
        let qty = newCart[d] || 0;
        const takeM = Math.min(qty, sumM);
        if (takeM > 0) {
          const target = 40 + drinkNo; // 41–44
          newCart[target] = (newCart[target] || 0) + takeM;
          sumM -= takeM;
          qty -= takeM;
        }
        const takeL = Math.min(qty, sumL);
        if (takeL > 0) {
          const target = 50 + drinkNo; // 51–54
          newCart[target] = (newCart[target] || 0) + takeL;
          sumL -= takeL;
          qty -= takeL;
        }
        if (qty > 0) {
          const target = 30 + drinkNo; // 31–34
          newCart[target] = (newCart[target] || 0) + qty;
          qty = 0;
        }
      }
      return { ...state, cart: newCart };
    }
    case "REPLACE_CART": {
      return { ...state, cart: { ...state.cart, ...action.cart } };
    }
    default:
      return state;
  }
};

// ------ 本体 ------

export const App = () => {
  //ユーザーが選択した予約時刻
  const [selectedTime, setSelectedTime] = useState(null);

  // ------ 画面遷移useReducer用の関数 ------
  const goto = (s) => dispatch({ type: "GOTO", step: s });
  const next = () => {
    if (state.step === "menu" && calculateNumberOfDrinksInMenu() === 0) {
      dispatch({ type: "GOTO", step: "cart" });
    } else if (state.step === "drink") {
      dispatch({ type: "ORGANIZE_CART" });
      dispatch({ type: "NEXT" });
    } else {
      dispatch({ type: "NEXT" });
    }
  };
  const prev = () => {
    if (state.step === "cart") {
      dispatch({ type: "CLEAR_TEMPORARY_DRINKS" });
      dispatch({ type: "GOTO", step: "menu" });
    } else {
      dispatch({ type: "PREV" });
    }
  };
  const addItems = (id) => dispatch({ type: "ADD_ITEM", itemId: id });
  const removeItems = (id) => dispatch({ type: "REMOVE_ITEM", itemId: id });

  //------ 計算用の関数 ------
  const calculateNumberOfDrinksInMenu = () => {
    return state.cart[30] + state.cart[40] + state.cart[50];
  };

  const calculateNumberOfDrinksInDrink = () => {
    return state.cart[91] + state.cart[92] + state.cart[93] + state.cart[94];
  };

  const calculateDifferenceOfDrinks = () => {
    return calculateNumberOfDrinksInMenu() - calculateNumberOfDrinksInDrink();
  };
  const calculateSumInMenu = () => {
    return (
      state.cart[10] +
      state.cart[20] +
      state.cart[30] +
      state.cart[40] +
      state.cart[50]
    );
  };

  const calculateSumPrice = () => {
    return (
      prices[10] * state.cart[10] +
      prices[20] * state.cart[20] +
      prices[30] * state.cart[30] +
      prices[40] * state.cart[40] +
      prices[50] * state.cart[50]
    );
  };

  // ------ カード決済用の変数・関数 ------

  //決済段階を表す変数
  const [state, dispatch] = useReducer(screenState, initialState);
  const [paymentPhase, setPaymentPhase] = useState("connecting");
  const paymentTimerRef = useRef(null);

  //決済結果を格納（displayReserved を追加）
  const [paymentOutcome, setPaymentOutcome] = useState({
    ok: false,
    orderId: null,
    error: null,
    receiptUrl: null,
    displayReserved: null,
  });

  // Square flow: orderId is created at entry to payment step
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [currentOrderCreatedAtIso, setCurrentOrderCreatedAtIso] =
    useState(null);

  //Square のカード入力 UI が DOM にアタッチされているかどうか
  const [cardAttached, setCardAttached] = useState(false);

  // 決済時のbillingの入力(姓、名、メアドを格納する変数)
  const [billingFamilyName, setBillingFamilyName] = useState("");
  const [billingGivenName, setBillingGivenName] = useState("");
  const [billingEmail, setBillingEmail] = useState("");

  // Square Card のインスタンス保持
  const cardRef = useRef(null);

  function clearCardContainer() {
    const el = document.getElementById("card-container");
    if (el) el.innerHTML = "";
  }

  async function destroyCardIfAny() {
    try {
      if (cardRef.current && typeof cardRef.current.destroy === "function") {
        await cardRef.current.destroy();
      }
    } catch (_) {
    } finally {
      cardRef.current = null;
      clearCardContainer();
      // UI 側フラグを戻しておく
      try {
        setCardAttached(false);
      } catch {}
    }
  }

  function pTimeout(promise, ms, msg = "attach timeout") {
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => reject(new Error(msg)), ms);
      promise
        .then((v) => {
          clearTimeout(t);
          resolve(v);
        })
        .catch((e) => {
          clearTimeout(t);
          reject(e);
        });
    });
  }

  async function ensureCardMounted(applicationId, locationId) {
    function waitForContainer(timeoutMs = 3000, intervalMs = 50) {
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

    async function tryAttach(
      card,
      selector = "#card-container",
      tries = 4,
      delayMs = 200
    ) {
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

    const container = await waitForContainer(8000, 50);
    if (!container) {
      throw new Error("#card-container が見つかりません（タイムアウト）。");
    }

    // 再アタッチを試みる（既に cardRef が存在するが DOM が空の場合）
    if (cardRef.current && container.childElementCount === 0) {
      try {
        const ok = await tryAttach(cardRef.current, "#card-container", 4, 300);
        if (ok) {
          setCardAttached(true);
          return;
        }
        await destroyCardIfAny();
      } catch (e) {
        await destroyCardIfAny();
      }
    }

    // 新規作成ルート
    if (!cardRef.current) {
      let payments;
      try {
        payments = window.Square.payments(applicationId, locationId);
      } catch (e) {
        throw new Error("Square.payments の初期化に失敗: " + (e?.message || e));
      }

      const card = await payments.card();

      const attached = await tryAttach(card, "#card-container", 4, 300);
      if (!attached) {
        try {
          await card.destroy?.();
        } catch {}
        throw new Error(
          "カードUIの attach に失敗しました（複数回リトライしてもダメでした）。"
        );
      }

      cardRef.current = card;
      // attach 成功をアプリに伝える
      setCardAttached(true);
      return;
    }

    // 既に attached されていて問題なければフラグを true に
    if (cardRef.current && container.childElementCount > 0) {
      setCardAttached(true);
    }
    return;
  }

  // ------ cookie復元: アプリ起動時に古い注文があればチェックして復元する ------
  useEffect(() => {
    try {
      const saved = getCookieJSON("cm_order_v1");
      console.log("DEBUG: cm_order_v1 cookie loaded:", saved);
      if (!saved) return;

      const { createdAt, reservedAtIso, orderId, itemsCart, displayReserved } =
        saved;
      if (!reservedAtIso) {
        // 不正なデータなら削除して終わり
        deleteCookie("cm_order_v1");
        return;
      }

      // 日時をISOとして解釈、失敗したらHH:mmでフォールバック
      function parseReservedFromSaved(savedReserved, savedCreatedAt) {
        if (!savedReserved) return null;
        // 1) ISO parse
        const byIso = new Date(savedReserved);
        if (!isNaN(byIso.getTime())) return byIso;
        // 2) try HH:mm
        const hhmm = String(savedReserved).trim();
        const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
        if (m) {
          const base = savedCreatedAt ? new Date(savedCreatedAt) : new Date();
          const hours = parseInt(m[1], 10);
          const minutes = parseInt(m[2], 10);
          if (hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60) {
            const r = new Date(base);
            r.setHours(hours, minutes, 0, 0);
            return r;
          }
        }
        return null;
      }

      const reserved = parseReservedFromSaved(reservedAtIso, createdAt);
      if (!reserved) {
        console.warn(
          "DEBUG: cm_order_v1 has invalid reservedAtIso, deleting cookie:",
          reservedAtIso
        );
        deleteCookie("cm_order_v1");
        return;
      }

      const now = new Date();
      const msSinceReserved = now.getTime() - reserved.getTime();
      const oneHourMs = 60 * 60 * 1000;
      if (msSinceReserved > oneHourMs) {
        console.log(
          "DEBUG: cm_order_v1 expired (more than 1 hour since reserved). Deleting cookie."
        );
        deleteCookie("cm_order_v1");
        return;
      }

      console.log(
        "DEBUG: cm_order_v1 is still valid. Restoring state from cookie."
      );
      if (itemsCart && typeof itemsCart === "object") {
        dispatch({ type: "REPLACE_CART", cart: itemsCart });
      }
      setSelectedTime(reserved.toISOString());
      setPaymentOutcome({
        ok: true,
        orderId: orderId || null,
        error: null,
        receiptUrl: null,
        displayReserved: displayReserved || formatDisplayReserved(reserved),
      });
      dispatch({ type: "GOTO", step: "paymentResult" });
    } catch (e) {
      console.warn("DEBUG: error while restoring cookie:", e);
    }
    // マウント時のみ
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.step !== "payment") return;

    setPaymentPhase("connecting");
    if (paymentTimerRef.current) clearTimeout(paymentTimerRef.current);
    destroyCardIfAny(); // 古いUI掃除

    // When entering payment step we must:
    // 1) Create an order on backend (send orderDate, reservedTime, items)
    // 2) Save the returned orderId for later charge
    // 3) Load Square SDK and move to input phase
    paymentTimerRef.current = setTimeout(async () => {
      try {
        // validate reserved time
        const reservedDate = parseReservedToDate(selectedTime);
        if (!reservedDate) {
          throw new Error("予約時刻が設定されていません。");
        }

        const createdAtIso = new Date().toISOString();
        const reservedAtIso = reservedDate.toISOString();

        // Build items (buildOrderItems already filters allowed ids)
        const items = buildOrderItems(state.cart);
        if (!items || items.length === 0) {
          throw new Error("カートが空です");
        }

        // Format dates to LocalDateTime string expected by backend DTO
        const orderDateLocal = toLocalDateTimeString(new Date(createdAtIso));
        const reservedLocal = toLocalDateTimeString(reservedDate);

        // Call backend to create order and obtain orderId
        if (USE_MOCK_PAYMENT) {
          // In development keep behavior consistent: still create a mock id
          const mockOrderId = "MOCK-" + Math.floor(Math.random() * 100000);
          setCurrentOrderId(mockOrderId);
          setCurrentOrderCreatedAtIso(createdAtIso);
        } else {
          const orderResp = await Api.createOrder({
            items,
            orderDate: orderDateLocal,
            reservedTime: reservedLocal,
            amount: calculateSumPrice(),
          });
          const returnedOrderId = orderResp?.orderId;
          if (!returnedOrderId)
            throw new Error("注文作成に失敗しました (orderId 未取得)");
          setCurrentOrderId(returnedOrderId);
          setCurrentOrderCreatedAtIso(createdAtIso);
        }

        // Load Square SDK after order creation
        const cfg = await Api.getSquareConfig();
        await loadSquareSdk(cfg?.environment || "PRODUCTION");
        setPaymentPhase("input"); // DOM will be rendered and next effect will attach card
      } catch (e) {
        alert(e?.message || "決済モジュールの初期化に失敗しました");
        dispatch({ type: "GOTO", step: "cart" });
      }
    }, 500);

    return () => {
      if (paymentTimerRef.current) clearTimeout(paymentTimerRef.current);
      destroyCardIfAny();
    };
  }, [state.step]);

  useEffect(() => {
    if (state.step !== "payment") return;
    if (paymentPhase !== "input") return;

    const attachTimer = setTimeout(() => {
      (async () => {
        try {
          const cfg = await Api.getSquareConfig();
          // DOMが描画された後に確実に ensureCardMounted を実行
          await ensureCardMounted(cfg.applicationId, cfg.locationId);
        } catch (e) {
          alert(e?.message || "#card-container の初期化に失敗しました");
          dispatch({ type: "GOTO", step: "cart" });
        }
      })();
    }, 100); // 100ミリ秒のわずかな遅延を設定

    return () => {
      clearTimeout(attachTimer); // クリーンアップ関数にタイマーのクリアを追加
    };
  }, [state.step, paymentPhase]);

  const canUseCookies = async () => {
    try {
      const key = "__cm_cookie_test";
      setCookieStr(key, "1", 60); // 60秒
      const v = getCookieStr(key);
      deleteCookie(key);
      return v === "1";
    } catch {
      return false;
    }
  };

  // billing-contact must be provided; no dummies
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ""));
  }

  function buildVerificationDetails(amountYen, billingContact) {
    if (
      !billingContact ||
      !String(billingContact.familyName || "").trim() ||
      !String(billingContact.givenName || "").trim() ||
      !String(billingContact.email || "").trim() ||
      !isValidEmail(billingContact.email)
    ) {
      throw new Error(
        "請求先情報が不正です。苗字・名前・有効なメールアドレスを入力してください。"
      );
    }

    return {
      amount: String(amountYen), // 例: "720"（JPYは小数なし）
      currencyCode: "JPY",
      intent: "CHARGE",
      customerInitiated: true,
      sellerKeyedIn: false,
      billingContact: {
        familyName: billingContact.familyName.trim(),
        givenName: billingContact.givenName.trim(),
        email: billingContact.email.trim(),
      },
    };
  }

  const handleSubmitOrderFlow = async () => {
    if (!(await canUseCookies()))
      throw new Error("このブラウザではCookieが使えません。");

    const items = buildOrderItems(state.cart);
    if (items.length === 0) throw new Error("カートが空です");

    const reservedDate = parseReservedToDate(selectedTime);
    if (!reservedDate) throw new Error("予約時刻が不正です");

    const reservedAtIso = reservedDate.toISOString();
    const amount = calculateSumPrice();

    // Ensure we have an orderId (should have been created on entering payment)
    let orderId = currentOrderId;
    let createdAtIso = currentOrderCreatedAtIso || new Date().toISOString();

    if (!orderId) {
      // Fallback: create order synchronously if missing
      if (USE_MOCK_PAYMENT) {
        orderId = "MOCK-" + Math.floor(Math.random() * 100000);
      } else {
        const orderDateLocal = toLocalDateTimeString(new Date(createdAtIso));
        const reservedLocal = toLocalDateTimeString(reservedDate);
        const orderResp = await Api.createOrder({
          items,
          orderDate: orderDateLocal,
          reservedTime: reservedLocal,
          amount,
        });
        orderId = orderResp?.orderId;
        if (!orderId) throw new Error("orderIdの発行に失敗しました");
      }
      setCurrentOrderId(orderId);
      setCurrentOrderCreatedAtIso(createdAtIso);
    }

    try {
      if (!cardRef.current) {
        const cfg2 = await Api.getSquareConfig();
        await ensureCardMounted(cfg2.applicationId, cfg2.locationId);
        if (!cardRef.current) throw new Error("カードUIの初期化に失敗しました");
      }
      console.log("DEBUG: Card UIアタッチ成功後のcardRef:", cardRef.current);

      // billing validation (strict — no fallback)
      if (
        !billingFamilyName.trim() ||
        !billingGivenName.trim() ||
        !billingEmail.trim()
      ) {
        throw new Error("氏名とメールアドレスを入力してください。");
      }
      if (!isValidEmail(billingEmail))
        throw new Error("有効なメールアドレスを入力してください。");

      const verificationDetails = buildVerificationDetails(amount, {
        familyName: billingFamilyName,
        givenName: billingGivenName,
        email: billingEmail,
      });

      const result = await cardRef.current.tokenize(verificationDetails);

      if (result.status !== "OK") {
        const msg =
          result.errors?.[0]?.message || "カードのトークン化に失敗しました";
        throw new Error(msg);
      }
      const sourceId = result.token;

      let payment;
      if (USE_MOCK_PAYMENT) {
        // Simulate a short delay
        await new Promise((r) => setTimeout(r, 300));
        payment = { status: "APPROVED", receiptUrl: "" };
      } else {
        // Send token + orderId to backend for processing
        payment = await Api.chargeOrder({
          orderId,
          sourceId,
          items,
          reservedAtIso,
          createdAtIso,
          amount,
        });
      }

      if (payment?.status === "APPROVED") {
        // cookie に保存（7日 -> 秒で指定）
        const displayReserved = formatDisplayReserved(reservedDate);
        setCookieJSON(
          "cm_order_v1",
          {
            createdAt: createdAtIso,
            reservedAtIso,
            orderId,
            itemsCart: state.cart,
            displayReserved,
          },
          7 * 24 * 60 * 60
        );

        // 保存内容を確認出力
        console.log("DEBUG: cm_order_v1 saved:", getCookieJSON("cm_order_v1"));

        setPaymentOutcome({
          ok: true,
          orderId,
          error: null,
          receiptUrl: payment?.receiptUrl || null,
          displayReserved,
        });
      } else {
        setPaymentOutcome({
          ok: false,
          orderId,
          error: payment?.error || "決済が承認されませんでした",
          receiptUrl: null,
          displayReserved: formatDisplayReserved(reservedDate),
        });
      }
    } catch (e) {
      setPaymentOutcome({
        ok: false,
        orderId: orderId || null,
        error: e?.message || "決済処理中にエラーが発生しました",
        receiptUrl: null,
        displayReserved: formatDisplayReserved(reservedDate),
      });
    }
    dispatch({ type: "GOTO", step: "paymentResult" });
  };

  // ------ ここからreturn ------
  return (
    <>
      <header>
        <Header />
        <div style={{ minHeight: "10px" }}></div>
      </header>

      {state.step === "title" && <Title onStart={next} />}

      {state.step === "menu" && (
        <>
          <div className="center-alignment">
            <div className="list-row">
              <Menu
                borderColor={"2px solid #ffbf7f"}
                backgroundColor={"#ffd3a8"}
                itemPrice={`¥${prices[40]}`}
                itemName={itemNames[40]}
                count={state.cart[40]}
                id={40}
                add={addItems}
                remove={removeItems}
                image={img_40}
                isSoldout={isSoldout[40]}
              />
              <Menu
                borderColor={"2px solid #ffbf7f"}
                backgroundColor={"#ffd3a8"}
                itemPrice={`¥${prices[50]}`}
                itemName={itemNames[50]}
                count={state.cart[50]}
                id={50}
                add={addItems}
                remove={removeItems}
                image={img_50}
                isSoldout={isSoldout[50]}
              />
            </div>
            <div className="list-row">
              <Menu
                borderColor={"2px solid #ffbf7f"}
                backgroundColor={"#ffd3a8"}
                itemPrice={`¥${prices[10]}`}
                itemName={itemNames[10]}
                count={state.cart[10]}
                id={10}
                add={addItems}
                remove={removeItems}
                image={img_10}
                isSoldout={isSoldout[10]}
              />
              <Menu
                borderColor={"2px solid #ffbf7f"}
                backgroundColor={"#ffd3a8"}
                itemPrice={`¥${prices[20]}`}
                itemName={itemNames[20]}
                count={state.cart[20]}
                id={20}
                add={addItems}
                remove={removeItems}
                image={img_20}
                isSoldout={isSoldout[20]}
              />
            </div>
            <div className="list-row">
              <Menu
                borderColor={"2px solid #ffbf7f"}
                backgroundColor={"#ffd3a8"}
                itemPrice={`¥${prices[30]}`}
                itemName={itemNames[30]}
                count={state.cart[30]}
                id={30}
                add={addItems}
                remove={removeItems}
                image={img_30}
                isSoldout={isSoldout[30]}
              />
            </div>
          </div>
          <div style={{ minHeight: "60px" }}></div>
        </>
      )}

      {state.step === "drink" && (
        <>
          <p
            style={{
              textAlign: "center",
              fontSize: "22px",
              margin: "10px auto",
            }}
          >
            飲み物を選択してください
          </p>
          {calculateDifferenceOfDrinks() > 0 && (
            <p
              style={{
                textAlign: "center",
                fontSize: "30px",
                fontWeight: "bold",
                margin: "10px auto",
                backgroundColor: "#9eceff",
              }}
            >
              {`あと ${calculateDifferenceOfDrinks()} 個`}
            </p>
          )}
          {calculateDifferenceOfDrinks() === 0 && (
            <p
              style={{
                textAlign: "center",
                fontSize: "30px",
                fontWeight: "bold",
                margin: "10px auto",
                backgroundColor: "#9eceff",
              }}
            >
              OK！
            </p>
          )}
          {calculateDifferenceOfDrinks() < 0 && (
            <p
              style={{
                textAlign: "center",
                fontSize: "30px",
                fontWeight: "bold",
                margin: "10px auto",
                backgroundColor: "#9eceff",
              }}
            >
              数を減らしてください
            </p>
          )}
          <div className="center-alignment">
            <div className="list-row">
              <Menu
                borderColor={"2px solid #7fbfff"}
                backgroundColor={"#a8d3ff"}
                itemName={itemNames[91]}
                count={state.cart[91]}
                id={91}
                add={addItems}
                remove={removeItems}
                difference={calculateDifferenceOfDrinks()}
                isDrinkScreen={state.step === "drink"}
                isSoldout={isSoldout[91]}
              />
              <Menu
                borderColor={"2px solid #7fbfff"}
                backgroundColor={"#a8d3ff"}
                itemName={itemNames[92]}
                count={state.cart[92]}
                id={92}
                add={addItems}
                remove={removeItems}
                difference={calculateDifferenceOfDrinks()}
                isDrinkScreen={state.step === "drink"}
                isSoldout={isSoldout[92]}
              />
            </div>
            <div className="list-row">
              <Menu
                borderColor={"2px solid #7fbfff"}
                backgroundColor={"#a8d3ff"}
                itemName={itemNames[93]}
                count={state.cart[93]}
                id={93}
                add={addItems}
                remove={removeItems}
                difference={calculateDifferenceOfDrinks()}
                isDrinkScreen={state.step === "drink"}
                isSoldout={isSoldout[93]}
              />
              <Menu
                borderColor={"2px solid #7fbfff"}
                backgroundColor={"#a8d3ff"}
                itemName={itemNames[94]}
                count={state.cart[94]}
                id={94}
                add={addItems}
                remove={removeItems}
                difference={calculateDifferenceOfDrinks()}
                isDrinkScreen={state.step === "drink"}
                isSoldout={isSoldout[94]}
              />
            </div>
          </div>
          <div style={{ minHeight: "60px" }}></div>
        </>
      )}
      {state.step === "cart" && (
        <>
          <p
            style={{
              textAlign: "center",
              fontSize: "22px",
              fontWeight: "bold",
              margin: "16px auto",
            }}
          >
            ご注文内容の確認
          </p>
          <div>
            <Order cart={state.cart} price={prices} names={itemNames} />
            <div style={{ minHeight: "60px" }}></div>
          </div>
        </>
      )}
      {state.step === "time" && (
        <>
          <div className="reservation-page-wrapper">
            {/* DANGER:本番はtestTimeはfalse、テスト時はtestDateにする */}
            <TimeSelect onTimeChange={setSelectedTime} testTime={testDate} />
          </div>
        </>
      )}
      {state.step === "payment" && (
        <>
          {paymentPhase === "connecting" && (
            <p style={{ marginLeft: "10px" }}>外部決済サービスに接続中...</p>
          )}
          {paymentPhase === "input" && (
            <div style={{ padding: "12px 10px" }}>
              <p style={{ margin: "6px 10px" }}>カード情報の入力</p>

              {/* billing fields */}
              <div style={{ margin: "6px 10px", marginBottom: 12 }}>
                <input
                  placeholder="苗字 (例: 山田)"
                  value={billingFamilyName}
                  onChange={(e) => setBillingFamilyName(e.target.value)}
                  style={{ width: "32%", marginRight: 6 }}
                />
                <input
                  placeholder="名前 (例: 太郎)"
                  value={billingGivenName}
                  onChange={(e) => setBillingGivenName(e.target.value)}
                  style={{ width: "32%", marginRight: 6 }}
                />
                <input
                  placeholder="メールアドレス (例: taro@example.com)"
                  value={billingEmail}
                  onChange={(e) => setBillingEmail(e.target.value)}
                  style={{ width: "68%" }}
                />
                <div style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                  ※3DS（本人認証）用に氏名とメールが必要になる場合があります
                </div>
              </div>

              <div id="card-container" style={{ margin: "12px 10px" }} />
              <button
                style={{ marginLeft: 10, width: 160, height: 32, fontSize: 14 }}
                disabled={
                  !cardAttached ||
                  !billingFamilyName.trim() ||
                  !billingGivenName.trim() ||
                  !billingEmail.trim()
                }
                onClick={async () => {
                  try {
                    await handleSubmitOrderFlow();
                  } catch (e) {
                    alert(e?.message || "決済でエラーが発生しました");
                  }
                }}
              >
                {cardAttached &&
                billingFamilyName.trim() &&
                billingGivenName.trim() &&
                billingEmail.trim()
                  ? "支払う"
                  : "支払う"}
              </button>
            </div>
          )}
        </>
      )}
      {state.step === "paymentResult" && (
        <>
          {paymentOutcome.ok ? (
            <div style={{ padding: "12px" }}>
              <p
                style={{
                  textAlign: "center",
                  fontSize: 22,
                  fontWeight: "bold",
                  margin: "16px auto",
                }}
              >
                決済が完了しました
              </p>
              <p style={{ textAlign: "center", fontSize: 18, margin: "6px" }}>
                注文番号：<b>{paymentOutcome.orderId}</b>
              </p>
              {paymentOutcome.receiptUrl && (
                <p style={{ textAlign: "center", margin: "6px" }}>
                  <a
                    href={paymentOutcome.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    レシートを開く
                  </a>
                </p>
              )}
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <button
                  style={{ width: 160, height: 44, fontSize: 18 }}
                  onClick={() => dispatch({ type: "GOTO", step: "numberTag" })}
                >
                  番号札を表示
                </button>
              </div>
            </div>
          ) : (
            <div style={{ padding: "12px" }}>
              <p
                style={{
                  textAlign: "center",
                  fontSize: 22,
                  fontWeight: "bold",
                  margin: "16px auto",
                  color: "red",
                }}
              >
                決済に失敗しました
              </p>
              {paymentOutcome.orderId && (
                <p
                  style={{ textAlign: "center", fontSize: 24, margin: "18px" }}
                >
                  予約時刻：
                  <b>
                    {paymentOutcome.displayReserved ??
                      formatReservedTimeHHmm(parseReservedToDate(selectedTime))}
                  </b>
                </p>
              )}
              <p style={{ textAlign: "center", fontSize: 16, margin: "6px" }}>
                {paymentOutcome.error || "不明なエラー"}
              </p>
              <div style={{ textAlign: "center", marginTop: 16 }}>
                <button
                  style={{
                    width: 160,
                    height: 44,
                    fontSize: 18,
                    marginRight: 10,
                  }}
                  onClick={() => {
                    setPaymentOutcome({
                      ok: false,
                      orderId: null,
                      error: null,
                      receiptUrl: null,
                      displayReserved: null,
                    });
                    dispatch({ type: "GOTO", step: "cart" });
                  }}
                >
                  カートに戻る
                </button>
                <button
                  style={{ width: 160, height: 44, fontSize: 18 }}
                  onClick={() => {
                    setPaymentOutcome({
                      ok: false,
                      orderId: null,
                      error: null,
                      receiptUrl: null,
                      displayReserved: null,
                    });
                    dispatch({ type: "GOTO", step: "payment" });
                  }}
                >
                  再試行
                </button>
              </div>
            </div>
          )}
        </>
      )}
      {state.step === "numberTag" && (
        <>
          <p
            style={{
              textAlign: "center",
              fontSize: "22px",
              fontWeight: "bold",
              margin: "16px auto",
            }}
          >
            ご注文ありがとうございます！
          </p>
          <p
            style={{
              textAlign: "center",
              fontSize: "20px",
              margin: "16px 0px 2px 0px",
            }}
          >
            注文番号
          </p>
          <p
            style={{
              textAlign: "center",
              fontSize: "60px",
              fontWeight: "bold",
              margin: "2px",
            }}
          >
            {paymentOutcome.orderId ?? "NNNNN"}
          </p>
          {paymentOutcome.displayReserved && (
            <p style={{ textAlign: "center", fontSize: 24, margin: "16px 0" }}>
              予約日時：{paymentOutcome.displayReserved}
            </p>
          )}
          <Order cart={state.cart} price={prices} names={itemNames} />
        </>
      )}
      {state.step !== "payment" &&
        state.step !== "paymentResult" &&
        state.step !== "complete" &&
        state.step !== "title" &&
        state.step !== "numberTag" && (
          <footer>
            <Footer
              sumPrice={calculateSumPrice()}
              prev={prev}
              next={next}
              goto={goto}
              currentStep={state.step}
              //WARNIG:本番はtestTimeはfalse、テスト時はtestDateにする
              testTime={testDate}
              numOfChosenMenu={calculateSumInMenu()}
              numOfOrderedDrinks={calculateNumberOfDrinksInMenu()}
              difference={calculateDifferenceOfDrinks()}
            />
          </footer>
        )}
    </>
  );
};

//ThisAppMadeBy
//Mika.Misono, Seia.Yurizono, Nagisa.Kirifuji,
//Ichika.Nakamasa, Hasumi.Hanekawa
