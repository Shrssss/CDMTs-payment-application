package com.CDMTs.paymentApp.controller;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
//import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.CDMTs.paymentApp.dto.PaymentRequest;
import com.CDMTs.paymentApp.service.PaymentService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class PaymentController {

	private final PaymentService service;
	
	/** sourceIdで決済リクエストを作成する */
	@PostMapping("/payment/create/{orderId}/{sourceId}")
	public PaymentRequest createPayment(@PathVariable String sourceId,@PathVariable int orderId,long amount,String currency) {
		return service.createPayment(sourceId,orderId);
	}
	
	
}
