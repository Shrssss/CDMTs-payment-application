package com.cdmts.paymentApps.model.dto;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
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
	@NotNull
	private Long orderId;
	@NotEmpty
	private List<OrderedItem> orderedItems;
	
	@Getter
	@Setter
	@NoArgsConstructor
	@AllArgsConstructor
	public static class OrderedItem{
		
		@NotNull
		private Long itemId;
		@NotNull
		private Integer price;
		@NotNull
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
