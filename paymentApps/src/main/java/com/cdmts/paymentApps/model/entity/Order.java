package com.cdmts.paymentApps.model.entity;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class Order{
	
	/** 注文番号 */
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
