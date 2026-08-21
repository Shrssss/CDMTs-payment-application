package com.cdmts.paymentApps.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.cdmts.paymentApps.model.entity.Order;

import java.util.List;

@Mapper
public interface OrderMapper {
	
	/** オーダーIDでオーダーの情報を取得 */
	public Order selectOrdersByOrderId(Integer orderId);
	/** すべてのオーダーを取得 */
	public List<Order> selectAllOrders();
	/** オーダーIDで受け渡しを取得 */
	public Integer selectServingStatusByOrderId(Integer orderId);
	/** servingStatusでorderを取得 */
	public List<Order> selectOrdersByServingStatus(Integer servingStatus);
	
	public Boolean selectPaymentStatusByOrderId(Integer orderId);
	
	public String selectIdempotencyKeyByOrderId(Integer orderId);

	
	/** 注文を登録 */
	public int insertOrder(Order order);
	

	/** 受け渡し状態の変更 */
	public int updateServingStatusByOrderId(Integer orderId,Integer servingStatus);
	/** paymentIdの挿入 */
	public int updatePaymentIdByOrderId(Integer orderId,String paymentId);
	/** 決済状況の更新 */
	public int updatePaymentStatusByOrderId(Integer orderId,Boolean paymentStatus);
	
	public int updateIdempotencyKeyByOrderId(@Param("orderId") Integer orderId,@Param("idempotencyKey") String idempotencyKey);
	
}
