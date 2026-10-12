package com.cdmts.paymentApps.model.dto;

import lombok.Getter;
import lombok.Setter;

@Getter 
@Setter 
public class CardPaymentRequest {

    private Long orderId;

    private String cardToken;

    private String mail;
}
