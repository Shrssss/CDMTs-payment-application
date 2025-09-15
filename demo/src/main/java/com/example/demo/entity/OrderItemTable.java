package com.example.demo.entity;

import lombok.Data;
@Data
public class OrderItemTable {
	/** 商品明細番号 */
	private Long orderItemId;
	/** 注文番号（外部キー） */
	private Long orderId;
    /** 商品番号（外部キー） */
    private Long itemId;
	/** 注文量 */
	private Integer quantity;
}
