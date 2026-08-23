package com.cdmts.paymentApps.model.dto;

import com.cdmts.paymentApps.model.entity.OrderItem;

public class OrderItemCreateRequest {
	
	    /** 商品番号（外部キー） */
	    private Long itemId;
		/** 注文量 */
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
