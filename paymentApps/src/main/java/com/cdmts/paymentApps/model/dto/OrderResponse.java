package com.cdmts.paymentApps.model.dto;

import java.time.LocalDateTime;
import java.util.List;

import com.cdmts.paymentApps.model.dto.OrderPaymentResponse.OrderedItem;
import com.cdmts.paymentApps.model.entity.Item;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

	@NotEmpty
	private List<OrderedItem> orderedItems;
	
	@Getter
	@Setter
	@NoArgsConstructor
	@AllArgsConstructor
	public static class OrderedItem{
		
		@NotNull
		private Long itemId;
		@NotBlank
		private String name;
		@NotNull
		private Integer quantity;
		
		public OrderedItem toOrderedItem(Item item,Integer quantity) {
			return new OrderedItem(item.getItemId(),item.getItemName(),quantity);
		}
	}
}
