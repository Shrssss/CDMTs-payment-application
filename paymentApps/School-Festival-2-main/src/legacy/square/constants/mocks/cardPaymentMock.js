// ⚠️ 未使用(Square廃止に伴い隔離。importしないこと)
// カード決済(Square)のモック時に使う決め打ち値。PaySysのモックは
// src/constants/mocks/paysysCardMock.js を参照。
export const MOCK_CARD_ORDER_ID = () => "MOCK-" + Math.floor(Math.random() * 100000);

export const MOCK_CARD_PAYMENT_RESULT = { status: "COMPLETED", receiptUrl: "" };
