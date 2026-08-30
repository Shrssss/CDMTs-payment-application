// 日時を表示用の文字列へ変換するユーティリティ。
export function toLocalDateTimeString(d: Date | string | number): string {
  const D = new Date(d);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${D.getFullYear()}-${p(D.getMonth() + 1)}-${p(D.getDate())}T${p(
    D.getHours()
  )}:${p(D.getMinutes())}:${p(D.getSeconds())}`;
}

export function formatDisplayReserved(d: Date | string | number): string {
  const D = new Date(d);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${D.getFullYear()}-${p(D.getMonth() + 1)}-${p(D.getDate())} ${p(
    D.getHours()
  )}:${p(D.getMinutes())}`;
}
