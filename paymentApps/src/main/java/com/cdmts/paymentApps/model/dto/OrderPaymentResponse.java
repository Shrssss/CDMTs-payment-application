package com.cdmts.paymentApps.model.dto;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderPaymentResponse {

	/** 注文番号（外部キー） */
	private Long orderId;
	
	private List<OrderedItem> orderedItems;
	
	@Getter
	@Setter
	@NoArgsConstructor
	@AllArgsConstructor
	public static class OrderedItem{
		
		private Long itemId;
		
		private Integer price;
		
		private Integer quantity;
	}
	
	public long getTotalAmount() {
		long sum=0;
		for(OrderedItem item:orderedItems) {
			sum+=item.getPrice()*item.getQuantity();
		}
		return sum;
	}
	
}
