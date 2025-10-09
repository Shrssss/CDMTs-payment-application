package com.CDMTs.paymentApp.model;

import lombok.Data;
@Data
public class OrderItem { 

	/** 商品明細番号 */
	private Integer orderItemId; //主キー
	/** 注文番号（外部キー） */
	private Integer orderId;
    /** 商品番号（外部キー） */
    private Integer itemId;
	/** 商品名 */
	private String itemName;
	/** 単価 */
	private Integer price;
	/** 在庫の有無*/
	private Boolean available;
	/** 注文量 */
	private Integer quantity;
	
	private Item item;
	
	public int getTotalPrice() {
		return (item!=null?item.getPrice():0)*quantity;
	}
}
