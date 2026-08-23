const encode = (v) => encodeURIComponent(v);
const decode = (v) => decodeURIComponent(v);

// 判定: 開発ローカルなら secure を付けない（localhost / 127.0.0.1 / ::1）
// 本番では location.protocol === "https:" で secure を付与する
function shouldUseSecureFlag() {
  try {
    const host = (location && location.hostname) || "";
    const proto = (location && location.protocol) || "";
    // treat localhost and loopback as non-secure dev hosts
    const isLocalhost =
      host === "localhost" || host === "127.0.0.1" || host === "::1";
    return proto === "https:" && !isLocalhost;
  } catch {
    // 安全側: 不明なら secure を付けない
    return false;
  }
}

export const setCookieStr = (k, v, maxAgeSec = 12 * 60 * 60) => {
  // maxAgeSec は秒数を期待
  const secureFlag = shouldUseSecureFlag() ? "; Secure" : "";
  // Path と SameSite は常に付ける（SameSite=Lax は通常の遷移で送られる）
  document.cookie = `${encode(k)}=${encode(v)}; Max-Age=${Number(
    maxAgeSec
  )}; Path=/; SameSite=Lax${secureFlag}`;
};

export const getCookieStr = (k) => {
  const hit = document.cookie
    .split("; ")
    .find((s) => s.startsWith(`${encode(k)}=`));
  return hit ? decode(hit.split("=")[1]) : undefined;
};

export const deleteCookie = (k) => {
  const secureFlag = shouldUseSecureFlag() ? "; Secure" : "";
  document.cookie = `${encode(
    k
  )}=; Max-Age=0; Path=/; SameSite=Lax${secureFlag}`;
};

export const setCookieJSON = (k, obj, maxAgeSec = 12 * 60 * 60) => {
  setCookieStr(k, JSON.stringify(obj), maxAgeSec);
};

export const getCookieJSON = (k) => {
  const s = getCookieStr(k);
  if (!s) return undefined;
  try {
    return JSON.parse(s);
  } catch {
    return undefined;
  }
};
