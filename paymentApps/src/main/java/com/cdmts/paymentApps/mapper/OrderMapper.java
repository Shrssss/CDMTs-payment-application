package com.cdmts.paymentApps.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.cdmts.paymentApps.model.entity.Order;

import java.util.List;

@Mapper
public interface OrderMapper {
	
	/** オーダーIDでオーダーの情報を取得 */
	public List<Order> selectOrdersByOrderIds(List<Long> orderIds);
	/** すべてのオーダーを取得 */
	public List<Order> selectAllOrders();
	/** オーダーIDで受け渡しを取得 */
	public Short selectServingStatusByOrderId(Long orderId);
	/** servingStatusでorderを取得 */
	public List<Order> selectOrdersByServingStatus(Short servingStatus);
	
	public Boolean selectPaymentStatusByOrderId(Long orderId);
	
	public String selectIdempotencyKeyByOrderId(Long orderId);

	
	/** 注文を登録 */
	public int insertOrder(Order order);
	

	/** 受け渡し状態の変更 */
	public int updateServingStatusByOrderId(Long orderId,Short servingStatus);
	/** paymentIdの挿入 */
	public int updatePaymentIdByOrderId(Long orderId,String paymentId);
	/** 決済状況の更新 */
	public int updatePaymentStatusByOrderId(Long orderId,Boolean paymentStatus);
	
	public int updateIdempotencyKeyByOrderId(@Param("orderId") Long orderId,@Param("idempotencyKey") String idempotencyKey);
	
}
