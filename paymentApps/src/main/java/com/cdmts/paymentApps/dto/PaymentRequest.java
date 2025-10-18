package com.cdmts.paymentApps.dto;

import lombok.Data;
@Data
public class PaymentRequest {
		/** 決済番号 */
	    private String paymentId;
	    /** 決済状況 */
	    private String status;
	    /** 決済金額 */
	    private Long amount;
	    /** 決済通貨 */
	    private String currency;
	    
	    private boolean hasKeyError;
}
