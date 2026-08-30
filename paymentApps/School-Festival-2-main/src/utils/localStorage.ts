// localStorage の読み書きと削除を安全に扱う汎用ユーティリティ。
export const setLocalStorageJSON = (key: string, obj: unknown): void => {
  try {
    window.localStorage.setItem(key, JSON.stringify(obj));
  } catch {
    // プライベートブラウジング等でlocalStorageが使えない場合は何もしない
  }
};

export const getLocalStorageJSON = <T = unknown>(key: string): T | undefined => {
  try {
    const s = window.localStorage.getItem(key);
    if (!s) return undefined;
    return JSON.parse(s) as T;
  } catch {
    return undefined;
  }
};

export const removeLocalStorageItem = (key: string): void => {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // 読み取れない場合は削除もできないため何もしない
  }
};
