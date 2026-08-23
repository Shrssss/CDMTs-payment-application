package com.cdmts.paymentApps.service;

import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cdmts.paymentApps.mapper.ItemMapper;
import com.cdmts.paymentApps.mapper.OrderItemMapper;
import com.cdmts.paymentApps.mapper.OrderMapper;
import com.cdmts.paymentApps.mapper.PaymentMapper;
import com.cdmts.paymentApps.model.dto.OrderPaymentResponse;
import com.cdmts.paymentApps.model.dto.PaymentResponse;
import com.cdmts.paymentApps.model.entity.Item;
import com.cdmts.paymentApps.model.entity.Order;
import com.cdmts.paymentApps.model.entity.OrderItem;
import com.squareup.square.SquareClient;
import com.squareup.square.types.Money;
import com.squareup.square.types.Currency;
import com.squareup.square.types.Payment;

import lombok.RequiredArgsConstructor;

import com.squareup.square.types.GetPaymentResponse;
import com.squareup.square.types.GetPaymentsRequest;
import com.squareup.square.types.CreatePaymentRequest;
import com.squareup.square.core.SquareApiException;

@Service
@RequiredArgsConstructor
public class PaymentService {
	
	private final SquareClient squareClient;
	
	private final OrderMapper orderMapper;
	
	private final OrderItemMapper orderItemMapper;
	
	private final ItemMapper itemMapper;
	
	private final PaymentMapper paymentMapper;
	
	@Transactional
	public PaymentResponse createPayment(Long orderId,String sourceId) {
		
		try {
			
			Order orderEntity=orderMapper.selectOrdersByOrderIds(List.of(orderId)).getFirst();
			
			List<OrderItem> orderItemEntities=orderItemMapper.selectOrderItemsByOrderId(orderId);
			
			if(orderItemEntities==null||orderItemEntities.isEmpty()) throw new IllegalArgumentException("指定されたorderIdが存在しません: "+orderId);
			
			List<Item> itemEntities=itemMapper.selectItemsByItemIds(
										orderItemEntities.stream()
											.map(orderItem->orderItem.getItemId())
											.toList()
										);
			
			Map<Long,Item>itemMap=itemEntities.stream()
									.collect(Collectors.toMap(Item::getItemId,item->item));
			
			OrderPaymentResponse orderPaymentDto=new OrderPaymentResponse(
														orderId,
														orderItemEntities.stream()
															.map(orderItem->new OrderPaymentResponse.OrderedItem(
																						orderItem.getItemId(),
																						itemMap.get(orderItem.getItemId()).getPrice(),
																						orderItem.getQuantity()
																					)
																)
															.toList()
													);
			
			PaymentResponse result=new PaymentResponse();
			
			boolean hasKeyError=false;
			
			long amount=orderPaymentDto.getTotalAmount();
			
			String existingKey=orderEntity.getIdempotencyKey();
			
			if(Boolean.TRUE.equals(orderEntity.getPaymentStatus())) hasKeyError=true;
			
			if(existingKey!=null&&!existingKey.isEmpty()) hasKeyError=true;
			
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
				

				
				result.setPaymentId(paymentId);
				
			    /** @return Indicates whether the payment is APPROVED, PENDING, COMPLETED, CANCELED, or FAILED.*/
			    result.setStatus(paymentDetails.getStatus().orElseThrow(()->new RuntimeException("Status is null")));
			    
			    result.setAmount(money.getAmount().orElseThrow(()->new RuntimeException("Amount is null")));
			    result.setCurrency(money.getCurrency().toString());
			    result.setHasKeyError(hasKeyError);
			    
			    boolean paymentStatus=(result.getStatus().equals("COMPLETED"));
							
				paymentMapper.updatePaymentIdAndStatusAndKey(orderId,paymentId.toString(),paymentStatus,newIdempotencyKey);
			    
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
