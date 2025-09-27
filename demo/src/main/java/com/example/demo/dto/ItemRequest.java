package com.example.demo.dto;

import lombok.Data;
@Data
public class ItemRequest {
	/** 商品番号 */
	private Integer itemId; //主キー
	/** 商品名 */
	private String itemName;
	/** 単価 */
	private Integer price;
	/** 在庫の有無*/
	private Boolean available;
}
