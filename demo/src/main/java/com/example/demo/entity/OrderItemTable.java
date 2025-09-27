package com.example.demo.entity;

import lombok.Data;
@Data
public class OrderItemTable {
	/** 商品明細番号 */
	private Integer orderItemId;
	/** 注文番号（外部キー） */
	private Integer orderId;
    /** 商品番号（外部キー） */
    private Integer itemId;
	/** 注文量 */
	private Integer quantity;
}
