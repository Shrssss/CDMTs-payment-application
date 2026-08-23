package com.cdmts.paymentApps.model.dto;

import com.cdmts.paymentApps.model.entity.Item;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ItemCreateRequest {

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

	public Item toEntity() {
		return new Item(
					null,
					itemName,
					price,
					available
				);
				
	}
	
}
