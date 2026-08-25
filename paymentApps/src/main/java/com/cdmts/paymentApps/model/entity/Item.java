package com.cdmts.paymentApps.model.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Item {
	
	/** 商品番号 */
	private Long itemId;
	/** 商品名 */
	private String itemName;
	/** 単価 */
	private Integer price;
	/** 商品画像のパス */
	private String imagePath;
	/** 在庫の有無*/
	private Boolean available;
	
}
