import type { PaymentPrepareResponse } from "../../types";

export function submitPaymentForm(
  prepared: PaymentPrepareResponse
): void {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = prepared.action;

  for (const [name, value] of Object.entries(prepared.fields)) {
    const input = document.createElement("input");
    input.type = "hidden";
    input.name = name;
    input.value = value;
    form.appendChild(input);
  }

  document.body.appendChild(form);

  try {
    form.submit();
  } finally {
    form.remove();
  }
}
