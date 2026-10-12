package com.cdmts.paymentApps.service;

import java.util.UUID;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.HashMap;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
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

	@Value("${paysys.public-origin}")
	private String publicOrigin;
	
	@Value("${paysys.action-url}")
	private String paymentActionUrl;

	@Value("${paysys.card-ip}")
	private String cardIp;

	@Value("${paysys.paypay-ip}")
	private String paypayIp;

	@Value("${paysys.return-paths.card-ok}")
	private String cardOkReturnPath;

	@Value("${paysys.return-paths.card-error}")
	private String cardErrorReturnPath;

	@Value("${paysys.return-paths.paypay-ok}")
	private String paypayOkReturnPath;

	@Value("${paysys.return-paths.paypay-cancel}")
	private String paypayCancelReturnPath;

	@Transactional
	public PaymentResponse createPayment(Long orderId,String sourceId) {
		
		try {
			List<Order> orderEntities = orderMapper.selectOrdersByOrderIds(List.of(orderId));
				
			if(orderEntities == null || orderEntities.isEmpty())
				throw new IllegalArgumentException("指定された注文が存在しません");
				
			Order orderEntity = orderEntities.get(0);
				
			List<OrderItem> orderItemEntities=orderItemMapper.selectOrderItemsByOrderId(orderId);
				
			if(orderItemEntities==null||orderItemEntities.isEmpty())
				throw new IllegalArgumentException("注文に明細がありません: "+orderId);
				
			List<Item> itemEntities=itemMapper.selectItemsByItemIds(
										orderItemEntities.stream()
											.map(orderItem->orderItem.getItemId())
											.toList()
										);
				
			Map<Long,Item>itemMap=itemEntities.stream()
									.collect(Collectors.toMap(Item::getItemId,item->item));
			
			long amount = calculateAmount(itemMap, orderItemEntities);
			
			validateAmount(amount);
			
			PaymentResponse result=new PaymentResponse();

			boolean hasKeyError=false;

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
	
	private long calculateAmount(Map<Long, Item> itemMap, List<OrderItem> orderItemEntities){
			long amount= 0L;

			for (OrderItem orderItem : orderItemEntities) {
    			Item item = itemMap.get(orderItem.getItemId());

    			if (item == null) {
					throw new IllegalArgumentException("指定されたitemIdが存在しません");
				}

				amount += (long) item.getPrice() * orderItem.getQuantity();
			}
			
			return amount;
	}
	
	private void validateAmount(long amount) {
    	if (amount <= 0 || amount > 9_999_999L) {
        	throw new IllegalArgumentException("決済金額が範囲外です");
    	}
	}

	private String generateSid(Long orderId){
		if(orderId==null || orderId<=0) {
			throw new IllegalArgumentException("注文番号が必要です");
		}

		String sid=Long.toString(orderId, 36);

		return "O" + sid;
	}

	public String getCardOkReturnUrl() {
		return publicOrigin + cardOkReturnPath;
	}

	public String getCardErrorReturnUrl() {
		return publicOrigin + cardErrorReturnPath;
	}

	public String getPaypayOkReturnUrl() {
		return publicOrigin + paypayOkReturnPath;
	}

	public String getPaypayCancelReturnUrl() {
		return publicOrigin + paypayCancelReturnPath;
	}

	public OrderPaymentResponse preparePayment(Long orderId) {

		String sid = generateSid(orderId);

		List<Order> orderEntities = orderMapper.selectOrdersByOrderIds(List.of(orderId));

		if (orderEntities == null || orderEntities.isEmpty()) {
			throw new IllegalArgumentException("指定された注文が存在しません: " + orderId);
		}

		List<OrderItem> orderItemEntities = orderItemMapper.selectOrderItemsByOrderId(orderId);
		
		if (orderItemEntities == null || orderItemEntities.isEmpty()) {
			throw new IllegalArgumentException("注文に明細がありません: " + orderId);
		}

		List<Item> itemEntities = itemMapper.selectItemsByItemIds(
				orderItemEntities.stream().map(OrderItem::getItemId).toList());
		
		Map<Long, Item> itemMap = itemEntities.stream()
				.collect(Collectors.toMap(Item::getItemId, item -> item));

		var orderpaymentResponse = new OrderPaymentResponse();

		long amount=calculateAmount(itemMap, orderItemEntities);

		validateAmount(amount);

		int updatedRows = paymentMapper.updateSidByOrderId(orderId, sid);

		if (updatedRows != 1) {
			throw new IllegalStateException("注文へのSID保存に失敗しました");
		}
		
		Map<String, String> fields = new HashMap<>();
			fields.put("K1", Long.toString(amount));
		
		String action = paymentActionUrl;
		
		orderpaymentResponse.setOrderId(orderId);
		orderpaymentResponse.setSid(sid);
		orderpaymentResponse.setAmount(amount);
		orderpaymentResponse.setAction(action);
		orderpaymentResponse.setFields(fields);

		return orderpaymentResponse;
	}

	public OrderPaymentResponse prepareCardpayment(Long orderId, String cardToken, String mail){
		
		OrderPaymentResponse response = preparePayment(orderId);
		
		Map<String, String> fields = response.getFields();

		fields.put("IP", cardIp);
		fields.put("SID", response.getSid());
		fields.put("STORE", "51");
		fields.put("TOKEN", cardToken);
		fields.put("KAKUTEI", "1");
		fields.put("MAIL", mail);
		fields.put("OKURL", getCardOkReturnUrl());
		fields.put("RT", getCardErrorReturnUrl());

		return response;
	}

	public OrderPaymentResponse preparePaypayPayment(Long orderId){
		
		OrderPaymentResponse response = preparePayment(orderId);
		
		Map<String, String> fields = response.getFields();

		fields.put("IP", paypayIp);
		fields.put("SID", response.getSid());
		fields.put("STORE", "42");
		fields.put("OKURL", getPaypayOkReturnUrl());
		fields.put("RT", getPaypayCancelReturnUrl());

		return response;
	}
}
