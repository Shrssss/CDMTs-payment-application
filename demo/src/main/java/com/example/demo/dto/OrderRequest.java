package com.example.demo.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import lombok.Data;
@Data
public class OrderRequest {
	/** 注文番号（主キー） */
	private Long orderId;
	/** 注文日時 */
	private LocalDateTime orderDate;
	/** 予約時間 */
	private LocalDateTime reservedTime;
	/** 受け渡しの状態(0,1,2) */
	private Integer servingStatus;
	/** ユーザID */
	private Long userId;
	/** 注文商品 */
	private List<OrderItemRequest>items=new ArrayList<>();
	
	@Data
	public static class OrderItemRequest {
	    /** 商品番号（外部キー） */
	    private Long itemId;
		/** 商品名 */
		private String itemName;
		/** 単価 */
		private Integer price;
		/** 在庫の有無*/
		private Boolean available;
		/** 注文量 */
		private Integer quantity;
	}
	
}
