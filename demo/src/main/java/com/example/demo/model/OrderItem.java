package com.example.demo.model;

import lombok.Data;
import java.util.Map;
import java.util.HashMap;
@Data
public class OrderItem {
	/** 商品番号 */
	private Long itemId;
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
