package com.cdmts.paymentApps.model.dto;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
public class ItemResponse {
	
	/** 商品番号 */
	private Long itemId;
	/** 商品名 */
	private String itemName;
	/** 単価 */
	private Integer price;
	/** 在庫の有無*/
	private Boolean available;
	
}
