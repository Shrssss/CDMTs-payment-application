package com.example.demo.service;

import java.util.UUID;

import org.springframework.stereotype.Service;

import com.squareup.square.SquareClient;
import com.squareup.square.types.Money;
import com.squareup.square.types.Currency;
import com.squareup.square.types.Payment;
import com.squareup.square.types.GetPaymentResponse;
import com.squareup.square.types.GetPaymentsRequest;
import com.squareup.square.types.CreatePaymentRequest;
import com.squareup.square.core.SquareApiException;
import com.example.demo.dto.PaymentRequest;
@Service
public class PaymentService {
	private final SquareClient squareClient;
	
	public PaymentService(SquareClient squareClient) {
		this.squareClient=squareClient;
	}
	
	/** 決済リクエストを作成し、PaymentRequest型の詳細を返す */
	public PaymentRequest createPayment(String sourceId,long amount,String currency) {
		try {
			var request=CreatePaymentRequest.builder()
							.sourceId(sourceId)
							.idempotencyKey(UUID.randomUUID().toString())
							.amountMoney(
								Money.builder()
									.amount(amount)
									.currency(Currency.valueOf(currency)).build()
							).build();
			
			var response=squareClient.payments().create(request);
			
			if(response.getErrors()!=null&&!response.getErrors().isEmpty()) {
				throw new RuntimeException("Square API Error: "+response.getErrors());
			}
			
			Payment createdPayment=response.getPayment()
					.orElseThrow(()->new RuntimeException("Payment creation returned null"));
			 
			String paymentId=createdPayment.getId()
					.orElseThrow(() -> new RuntimeException("paymentId is null"));
					
			GetPaymentResponse getResponse=squareClient.payments().get(
					GetPaymentsRequest.builder()
							.paymentId(paymentId).build()
					);		
				
			Payment paymentDetails=getResponse.getPayment()
						.orElseThrow(()->new RuntimeException("Payment not found"));
			
			Money money=paymentDetails.getAmountMoney()
					.orElseThrow(()->new RuntimeException("AmountMoney is null"));
			
			PaymentRequest result=new PaymentRequest();
			result.setPaymentId(paymentId);
		    result.setStatus(paymentDetails.getStatus().orElseThrow(()->new RuntimeException("Status is null")));
		    result.setAmount(money.getAmount().orElseThrow(()->new RuntimeException("Amount is null")));
		    result.setCurrency(money.getCurrency().toString());
			
			return result;
			
		}catch(SquareApiException e) {
			throw new RuntimeException("Square API Exception: "+e.getMessage(),e);
		}
	}
	
}
