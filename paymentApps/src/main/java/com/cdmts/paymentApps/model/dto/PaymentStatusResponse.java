package com.cdmts.paymentApps.model.dto;

/** WAITINGは未払い・通知待ちを表し、失敗や取消の確定ではない。 */
public record PaymentStatusResponse(Long orderId, String state) {
}
