package com.cdmts.paymentApps.model.entity;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Order{
	
	/** 注文番号 */
	private Long orderId;
	/** 注文日時 */
	private LocalDateTime orderDate;
	/** 予約時間 */
	private LocalDateTime reservedTime;
	/** 受け渡しの状態(0,1,2) */
	private Short servingStatus;
	/** 決済番号(SquareApi依存) */
	private String paymentId;
	/** 決済状況 */
	private Boolean paymentStatus;
	
	private String idempotencyKey;

}
