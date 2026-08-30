// ⚠️ 未使用(Square廃止に伴い隔離。importしないこと)
// 決済画面の初期化と Square SDK の読み込み状態を整えるロジック。
// 注文作成は行わない(カードのトークン化成功後・課金直前に行う。usePaymentFlow.js 参照)。
export async function initializePaymentScreen({
  getSquareConfig,
  loadSquareSdk,
  setPaymentState,
  useMockPayment = false,
}) {
  const cfg = await getSquareConfig({ useMockPayment });
  await loadSquareSdk(cfg?.environment || "PRODUCTION");
  setPaymentState((prev) => ({ ...prev, phase: "input" }));
  return cfg;
}