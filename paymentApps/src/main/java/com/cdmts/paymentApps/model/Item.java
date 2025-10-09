package com.cdmts.paymentApps.model;

import lombok.Data;
@Data
public class Item { //事前登録型　登録の詳細はitemMemo参照
	/** 商品番号 */
	private Integer itemId; //主キー
	/** 商品名 */
	private String itemName;
	/** 単価 */
	private Integer price;
	/** 在庫の有無*/
	private Boolean available;
}
