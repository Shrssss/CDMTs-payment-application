package com.cdmts.paymentApps.model.dto;

import java.time.LocalDateTime;

public class OrderRequest {
	/** 注文番号（主キー） */
	private Integer orderId;
	/** 注文日時 */
	private LocalDateTime orderDate;
	/** 予約時間 */
	private LocalDateTime reservedTime;
	/** 受け渡しの状態(0,1,2) */
	private Integer servingStatus;
	/** 決済番号(SquareApi依存) */
	private String paymentId;
	/** 決済状況 */
	private Boolean paymentStatus;
	
	private String idempotencyKey;
	
}
