package com.cdmts.paymentApps.model.dto;

import com.cdmts.paymentApps.model.entity.Item;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ItemCreateRequest {

	/** 商品名 */
	private String itemName;
	/** 単価 */
	private Integer price;
	/** 在庫の有無*/
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
