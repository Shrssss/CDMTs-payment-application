// ⚠️ 未使用(Square廃止に伴い隔離。importしないこと)
// Square 決済に渡す請求先情報を検証し、verification details を組み立てるロジック。
import { isValidEmail } from "../../../../utils/validation";

export function buildVerificationDetails(amountYen, billingContact) {
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
    amount: String(amountYen),
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