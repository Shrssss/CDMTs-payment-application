// テスト用の固定時刻を経過時間込みで再計算するユーティリティ。App.tsxが使用する。
export function getCurrentTestDate(appStartTime: number, testDate: Date): Date {
  const elapsedMs = Date.now() - appStartTime;
  return new Date(testDate.getTime() + elapsedMs);
}
