// 決済代行(Paysys)へ送り出したが、まだ支払済みを確認できていない注文の照合ID(SID)を扱う。
// 注文内容はバックエンドから SID で取り直すため、ここには SID と保存時刻だけを持つ。
// localStorage に置くので、別タブで戻ってきた場合や、タブを閉じた後に開き直した場合でも拾える。
// 期限(PENDING_PAYMENT_TTL_MS)を過ぎたものは読み出し時に捨てる。

export const PENDING_PAYMENTS_KEY = "cm_pending_payments_v1";
/** これより古い保留中のSIDは捨てる(屋台は当日中に受け取るため)。 */
export const PENDING_PAYMENT_TTL_MS = 12 * 60 * 60 * 1000;

export interface PendingPayment {
  sid: string;
  /** 保存した日時(ISO形式)。期限の判定に使う。 */
  savedAt: string;
}

const SID_PATTERN = /^[0-9a-f]{16}$/;

export const isValidSid = (sid: unknown): sid is string =>
  typeof sid === "string" && SID_PATTERN.test(sid);

const isPendingPayment = (value: unknown): value is PendingPayment => {
  const v = value as PendingPayment | null;
  return !!v && isValidSid(v.sid) &&
    typeof v.savedAt === "string" && Number.isFinite(Date.parse(v.savedAt));
};

const writePendingPayments = (list: PendingPayment[]): void => {
  if (list.length === 0) localStorage.removeItem(PENDING_PAYMENTS_KEY);
  else localStorage.setItem(PENDING_PAYMENTS_KEY, JSON.stringify(list));
};

/** 期限内の保留中SIDを新しい順で返す。期限切れ・壊れた値はここで取り除く。 */
export function readPendingPayments(now: Date = new Date()): PendingPayment[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(PENDING_PAYMENTS_KEY) || "[]");
    const list = Array.isArray(raw) ? raw : [];
    const alive = list
      .filter(isPendingPayment)
      .filter((p) => now.getTime() - Date.parse(p.savedAt) < PENDING_PAYMENT_TTL_MS)
      .sort((a, b) => Date.parse(b.savedAt) - Date.parse(a.savedAt));
    if (alive.length !== list.length) {
      try { writePendingPayments(alive); } catch { /* 掃除できなくても読み出しは続ける */ }
    }
    return alive;
  } catch {
    return [];
  }
}

// 外部決済へ送り出す直前に呼ぶ。保存できなければ例外を投げ、呼び出し側は送り出しを止める。
export function savePendingPayment(sid: string, now: Date = new Date()): void {
  if (!isValidSid(sid)) throw new Error("照合IDが不正です。");
  const others = readPendingPayments(now).filter((p) => p.sid !== sid);
  writePendingPayments([{ sid, savedAt: now.toISOString() }, ...others]);
}

// 支払済みを確認したとき、または利用者が確認をやめてトップへ戻ったときに呼ぶ。
export function removePendingPayment(sid: string): void {
  try {
    writePendingPayments(readPendingPayments().filter((p) => p.sid !== sid));
  } catch { /* 使えない場合は残っていないので何もしない */ }
}

const PAYMENT_RETURN_PARAMS = ["paysys_return", "result", "SID", "ERROR", "return_sid"];

export interface PaymentReturnParams {
  /** 戻りURLの照合ID。読み取れなければ null。 */
  sid: string | null;
  /** キャンセル・エラーで戻ってきた(支払いが完了していない可能性がある)。 */
  incomplete: boolean;
}

/** Paysysからの戻りURLのクエリを読む。戻りパラメータが1つも無ければ null。 */
export function readPaymentReturnParams(search: string): PaymentReturnParams | null {
  const params = new URLSearchParams(search);
  if (!PAYMENT_RETURN_PARAMS.some((key) => params.has(key))) return null;
  // バックエンドが付ける return_sid を優先し、決済会社が付ける SID でも受け付ける。
  const sid = [params.get("return_sid"), params.get("SID")].find(isValidSid) ?? null;
  const result = params.get("result");
  return { sid, incomplete: result === "cancel" || result === "error" || params.has("ERROR") };
}

// Paysysからの戻りパラメータをURLから消す(履歴は増やさない)。
// 画面を表すハッシュ(#/payment/result 等)と react-router の履歴状態はそのまま残す。
export function clearPaymentReturnParams(): void {
  const url = new URL(window.location.href);
  PAYMENT_RETURN_PARAMS.forEach(key => url.searchParams.delete(key));
  window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
}
