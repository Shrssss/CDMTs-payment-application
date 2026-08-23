package com.cdmts.paymentApps.model.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.cdmts.paymentApps.model.entity.Order;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;

@Getter
public class OrderCreateRequest {

	/** 注文日時 */
	@NotNull
	private LocalDateTime orderDate;
	/** 予約時間 */
	@NotNull
	private LocalDateTime reservedTime;
	/** 受け渡しの状態(0,1,2) */
	@NotNull
	private Short servingStatus;
	/** 決済状況 */
	@NotNull
	private Boolean paymentStatus;
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
