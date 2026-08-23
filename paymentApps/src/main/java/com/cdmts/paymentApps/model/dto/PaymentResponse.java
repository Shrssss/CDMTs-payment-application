package com.cdmts.paymentApps.model.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PaymentResponse {
	
		/** 決済番号 */
		@NotBlank
	    private String paymentId;
	    /** 決済状況 */
		@NotBlank
	    private String status;
	    /** 決済金額 */
		@NotNull
	    private Long amount;
	    /** 決済通貨 */
		@NotBlank
	    private String currency;
		@NotNull
	    private boolean hasKeyError;
	    
}
