package com.cdmts.paymentApps.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.cdmts.paymentApps.model.entity.Order;

@Mapper
public interface PaymentMapper {

	public Boolean selectPaymentStatusByOrderId(Long orderId);
	
	public String selectIdempotencyKeyByOrderId(Long orderId);

	public int updateSidByOrderId(@Param("orderId") Long orderId,
									@Param("sid") String sid);

	public Order selectOrderBySid(@Param("sid") String sid);

	public int markPaidBySid(@Param("sid") String sid);
	
	public int updatePaymentIdAndStatusAndKey(@Param("orderId")Long orderId,
													@Param("paymentId")String paymentId,
													@Param("paymentStatus")Boolean paymentStatus,
													@Param("idempotencyKey")String idempotencyKey);
	
}
