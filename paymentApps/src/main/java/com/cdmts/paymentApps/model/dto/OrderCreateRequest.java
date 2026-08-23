package com.cdmts.paymentApps.model.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.cdmts.paymentApps.model.entity.Order;

import lombok.Getter;

@Getter
public class OrderCreateRequest {

//	/** 注文番号（主キー） */
//	private Long orderId;
	/** 注文日時 */
	private LocalDateTime orderDate;
	/** 予約時間 */
	private LocalDateTime reservedTime;
	/** 受け渡しの状態(0,1,2) */
	private Short servingStatus;
//	/** 決済番号(SquareApi依存) */
//	private String paymentId;
	/** 決済状況 */
	private Boolean paymentStatus;

//	private String idempotencyKey;
	/** 注文商品 */
	private List<OrderItemCreateRequest>items;

	public Order toEntity() {
		return new Order(
					null,
					orderDate,
					reservedTime,
					servingStatus,
					null,
					paymentStatus,
					null
				);
	}
	
}
