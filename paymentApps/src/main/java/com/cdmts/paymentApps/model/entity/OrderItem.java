package com.cdmts.paymentApps.model.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderItem { 

	/** 商品明細番号 */
	private Long orderItemId;
	/** 注文番号（外部キー） */
	private Long orderId;
    /** 商品番号（外部キー） */
    private Long itemId;
	/** 注文量 */
	private Integer quantity;
	
}
