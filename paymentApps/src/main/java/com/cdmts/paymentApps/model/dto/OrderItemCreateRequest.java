package com.cdmts.paymentApps.model.dto;

import com.cdmts.paymentApps.model.entity.OrderItem;

import jakarta.validation.constraints.NotNull;

public class OrderItemCreateRequest {
	
	    /** 商品番号（外部キー） */
		@NotNull
	    private Long itemId;
		/** 注文量 */
		@NotNull
		private Integer quantity;
		
		public OrderItem toEntity(Long orderId) {
			return new OrderItem(
							null,
							orderId,
							itemId,
							quantity
					);
					
		}
		
}
