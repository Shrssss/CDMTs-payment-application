package com.cdmts.paymentApps.model.dto;

import java.util.Map;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class OrderPaymentResponse {

	@NotNull
	private Long orderId;
	
	@NotNull 
    private String sid;

	/** 決済金額 */
	@NotNull 
    private Long amount;

	/** 決済URL */
	@NotNull 
    private String action;

	/** 外部フォームの送信フィールド */
	@NotNull 
    private Map<String, String> fields;
}
