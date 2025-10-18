package com.cdmts.paymentApps.service;

import java.util.UUID;
import java.util.Map;
import java.util.HashMap;

import org.springframework.stereotype.Service;

import com.cdmts.paymentApps.dto.PaymentRequest;
import com.cdmts.paymentApps.model.Order;
import com.squareup.square.SquareClient;
import com.squareup.square.types.Money;
import com.squareup.square.types.Currency;
import com.squareup.square.types.Payment;
import com.squareup.square.types.GetPaymentResponse;
import com.squareup.square.types.GetPaymentsRequest;
import com.squareup.square.types.CreatePaymentRequest;
import com.squareup.square.core.SquareApiException;
@Service
public class PaymentService {
	private final SquareClient squareClient;
	private final OrderService orderService;
	
	public PaymentService(SquareClient squareClient,OrderService orderService) {
		this.squareClient=squareClient;
		this.orderService=orderService;
	}
	
	/** 決済リクエストを作成し、PaymentRequest型の詳細を返す */ //square関連はすべてOptionalなのでnull処理しなくていいとか言わないでください
	public PaymentRequest createPayment(int orderId,String sourceId) {
		try {
			Order selectedOrder=orderService.getOrder(orderId);
			
			PaymentRequest result=new PaymentRequest();
			
			boolean hasKeyError=false;
			
			if(selectedOrder==null) {
				throw new IllegalArgumentException("指定されたorderIdが存在しません: "+orderId);
			}
			
			long amount=selectedOrder.getTotalAmount();
			
			String existingKey=orderService.selectIdempotencyKeyByOrderId(orderId);
			
			if(orderService.selectPaymentStatusByOrderId(orderId)==true) {
				hasKeyError=true;
			}
			
			if(existingKey!=null&&!existingKey.isEmpty()) {
				hasKeyError=true;
			}
			
			if(hasKeyError) {
				
				result.setHasKeyError(hasKeyError);
				
				return result;
				
			}else {
				
				String newIdempotencyKey=UUID.randomUUID().toString();
				
				var request=CreatePaymentRequest.builder()
								.sourceId(sourceId)
								.idempotencyKey(newIdempotencyKey)
								.amountMoney(
									Money.builder()
										.amount(amount)
										.currency(Currency.valueOf("JPY")).build()
								).locationId("LYP1FB67EDXBN").build(); //<- sandbox //LYP1FB67EDXBN
				
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
				
				orderService.updateIdempotencyKeyByOrderId(orderId,newIdempotencyKey);
				
				result.setPaymentId(paymentId);
			    result.setStatus(paymentDetails.getStatus().orElseThrow(()->new RuntimeException("Status is null")));
			    result.setAmount(money.getAmount().orElseThrow(()->new RuntimeException("Amount is null")));
			    result.setCurrency(money.getCurrency().toString());
			    result.setHasKeyError(hasKeyError);
			    
							boolean tf=(result.getStatus().equals("COMPLETED"));

			    orderService.updatePaymentIdByOrderId(orderId,paymentId.toString());
			    orderService.updatePaymentStatusByOrderId(orderId,tf);
			    
				return result;
			}
			

			
		}catch(SquareApiException e) {
			throw new RuntimeException("Square API Exception: "+e.getMessage(),e);
		}
	}
	
	public Map<String,String> getSquareClient(){
		Map<String,String> client=new HashMap<>();
		
		client.put("applicationId","sq0idp-VLfeIy3EnmoACHjocINrRA");
		client.put("locationId","LYP1FB67EDXBN");
		client.put("environment","PRODUCTION");
		
		return client;
	}
	
	
}
