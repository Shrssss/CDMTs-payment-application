package com.cdmts.paymentApps.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@AllArgsConstructor
public class ItemResponse {
	
	/** 商品番号 */
	@NotNull
	private Long itemId;
	/** 商品名 */
	@NotBlank
	@Size(max=255)
	private String itemName;
	/** 単価 */
	@NotNull
	private Integer price;
	/** 在庫の有無*/
	@NotNull
	private Boolean available;
	
}
