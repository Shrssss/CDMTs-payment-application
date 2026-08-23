package com.cdmts.paymentApps.model.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

	/** 注文番号 */
	private Long orderId;
	/** 注文日時 */
	private LocalDateTime orderDate;
	/** 予約時間 */
	private LocalDateTime reservedTime;
	/** 受け渡しの状態(0,1,2) */
	private Short servingStatus;

}
