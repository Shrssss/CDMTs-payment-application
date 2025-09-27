package com.example.demo.entity;

import java.time.LocalDateTime;

import lombok.Data;
@Data
public class OrderTable { // <-DB用
	/** 注文番号 */
	private Long orderId;
	/** 注文日時 */
	private LocalDateTime orderDate;
	/** 予約時間 */
	private String reservedTime;
	/** 受け渡しの有無 */
	private Boolean servingStatus;
	/** ユーザID */
	private Long userId;
}
