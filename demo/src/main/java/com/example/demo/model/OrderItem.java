package com.example.demo.model;

import lombok.Data;
@Data
public class OrderItem { //テーブルは外部キーとしてorderIdを持つ
	/** 商品番号 */
	private Long itemId; //主キー
	/** 商品名 */
	private String itemName;
	/** 注文量 */
	private Integer quantity;
	/** 単価 */
	private Integer price;
	
	/** 総額を算出 */
	public int getTotalPrice() {
		return price*quantity;
	}
}
