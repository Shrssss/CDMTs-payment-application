package com.cdmts.paymentApps.controller;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.cdmts.paymentApps.dto.PaymentRequest;
import com.cdmts.paymentApps.service.PaymentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PaymentController {

	private final PaymentService service;
	
	/** sourceIdで決済リクエストを作成する */
	@PostMapping("/payment/create/{orderId}/{sourceId}")
	public PaymentRequest createPayment(@PathVariable int orderId,@PathVariable String sourceId) {
		return service.createPayment(orderId,sourceId);
	}
	
	
}
