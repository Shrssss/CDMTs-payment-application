package com.cdmts.paymentApps.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderedItemRow {


		
		@NotNull
		private Long orderId;
		@NotNull
		private Long itemId;
		@NotBlank
		private String name;
		@NotNull
		private Integer quantity;
		

}
