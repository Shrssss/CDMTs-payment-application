package com.cdmts.paymentApps.model.dto;

import java.time.LocalDateTime;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
public class OrderResponse {

	/** 注文番号 */
	@NotNull
	private Long orderId;
	/** 注文日時 */
	@NotNull
	private LocalDateTime orderDate;
	/** 予約時間 */
	@NotNull
	private LocalDateTime reservedTime;
	/** 受け渡しの状態(0,1,2) */
	@NotNull
	private Short servingStatus;

}
