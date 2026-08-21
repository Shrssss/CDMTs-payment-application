package com.cdmts.paymentApps.model.entity;

import lombok.Data;
@Data
public class Item {
	
	/** 商品番号 */
	private Integer itemId;
	/** 商品名 */
	private String itemName;
	/** 単価 */
	private Integer price;
	/** 在庫の有無*/
	private Boolean available;
	
}
