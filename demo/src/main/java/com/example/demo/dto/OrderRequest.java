package com.example.demo.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import lombok.Data;
@Data
public class OrderRequest {
	/** 注文番号（外部キー） */
	private Long orderId;
	/** 注文日時 */
	private LocalDateTime orderDate;
	/** 受け渡しの有無 */
	private Boolean servingStatus;
	/** ユーザID */
	private Long userId;
	/** 注文商品 */
	private List<OrderItemRequest>items=new ArrayList<>();
	
	@Data
	public static class OrderItemRequest {
	    /** 商品番号（外部キー） */
	    private Long itemId;
		/** 注文量 */
		private Integer quantity;
	}
	
}
