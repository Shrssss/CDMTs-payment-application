// 入力されたメールアドレスの最低限の妥当性を判定するユーティリティ。
export function isValidEmail(email: unknown): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email ?? ""));
}
