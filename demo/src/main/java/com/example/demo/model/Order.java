package com.example.demo.model;

import lombok.Data;
import lombok.EqualsAndHashCode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
@Data
@EqualsAndHashCode(callSuper=true)
public class Order extends CommonData{
	/** 注文番号 */
	private Long orderId;
	/** 注文日時 */
	private LocalDateTime orderDate;
	/** 予約時間 */
	private String reservedTime;
	/** 受け渡しの状態(0,1,2) */
	private Integer servingStatus;
	/** ユーザID */
	private Long userId;
	/** 注文商品 */
	private List<OrderItem>items=new ArrayList<>();
	
	 /** 注文合計金額 */
	public int getTotalAmount() {
		return items.stream().mapToInt(OrderItem::getTotalPrice).sum();
	}
}
