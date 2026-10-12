package com.cdmts.paymentApps.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cdmts.paymentApps.model.dto.PayPayPaymentRequests;
import com.cdmts.paymentApps.model.dto.OrderPaymentResponse;
import com.cdmts.paymentApps.model.dto.CardPaymentRequest;
import com.cdmts.paymentApps.model.dto.PaymentResponse;
import com.cdmts.paymentApps.service.PaymentService;

import lombok.RequiredArgsConstructor;

import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PaymentController {

	private final PaymentService paymentService;

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
