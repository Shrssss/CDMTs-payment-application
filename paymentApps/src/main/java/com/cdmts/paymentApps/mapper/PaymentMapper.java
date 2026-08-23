package com.cdmts.paymentApps.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PaymentMapper {

	public Boolean selectPaymentStatusByOrderId(Long orderId);
	
	public String selectIdempotencyKeyByOrderId(Long orderId);
	
	public int updatePaymentIdAndStatusAndKey(@Param("orderId")Long orderId,
													@Param("paymentId")String paymentId,
													@Param("paymentStatus")Boolean paymentStatus,
													@Param("idempotencyKey")String idempotencyKey);
	
}
