package com.cdmts.paymentApps.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import com.cdmts.paymentApps.model.dto.PayPayPaymentRequests;
import com.cdmts.paymentApps.model.dto.OrderPaymentResponse;
import com.cdmts.paymentApps.model.dto.CardPaymentRequest;
import com.cdmts.paymentApps.model.dto.PaymentResponse;
import com.cdmts.paymentApps.service.PaymentService;
import com.cdmts.paymentApps.service.NotificationService;
import com.cdmts.paymentApps.model.dto.PaymentStatusResponse;

import lombok.RequiredArgsConstructor;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PaymentController {

	private final PaymentService paymentService;
	private final NotificationService notificationService;

	/** カード決済を準備する */
	@PostMapping("/payments/card")
	public OrderPaymentResponse prepareCardPayment(
        @RequestBody CardPaymentRequest request) {

    return paymentService.prepareCardpayment(
            request.getOrderId(),
            request.getCardToken(),
            request.getMail());
	}

	@PostMapping ("/payments/paypay")
	public OrderPaymentResponse preparePayPayPayment(
		@RequestBody PayPayPaymentRequests request) {

	return paymentService.preparePaypayPayment(request.getOrderId());
	}

	@PostMapping(value = "/payments/paysys/card/notify", produces = MediaType.TEXT_PLAIN_VALUE)
	public String handleCardPaymentNotification(@RequestParam Map<String, String> notification) {
		notificationService.handlePaymentNotification(notification);
		return "0\r\n";
	}

	@PostMapping(value = "/payments/paysys/paypay/notify", produces = MediaType.TEXT_PLAIN_VALUE)
	public String handlePayPayPaymentNotification(@RequestParam Map<String, String> notification) {
		notificationService.handlePaymentNotification(notification);
		return "0\r\n";
	}

	@GetMapping("/payments/{orderId}/status")
	public ResponseEntity<PaymentStatusResponse> getPaymentStatus(@PathVariable Long orderId) {
		return ResponseEntity.ok().header("Cache-Control", "no-store")
				.body(paymentService.getPaymentStatus(orderId));
	}

	@GetMapping("/payments/return/{sid}")
	public ResponseEntity<PaymentService.PaymentReturnOrder> getPaymentReturnOrder(@PathVariable String sid) {
		return ResponseEntity.ok().header("Cache-Control", "no-store")
				.body(paymentService.getPaymentReturnOrder(sid));
	}

	/** sourceIdで決済リクエストを作成する */
	@PostMapping("/payments/create/{orderId}/{sourceId}")
	public PaymentResponse createPayment(@PathVariable Long orderId,@PathVariable String sourceId) {
		return paymentService.createPayment(orderId,sourceId);
	}
	
	@GetMapping("/square/config")
	public Map<String,String> getSquareClient() {
		return paymentService.getSquareClient();
	}
	
}
