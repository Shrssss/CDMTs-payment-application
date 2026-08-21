package com.cdmts.paymentApps.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.cdmts.paymentApps.entity.OrderItemTable;
import com.cdmts.paymentApps.entity.OrderTable;
import com.cdmts.paymentApps.model.entity.Item;

import java.util.List;

@Mapper
public interface OrderMapper {
	
	/** オーダーIDでオーダーの情報を取得 */
	public OrderTable selectOrdersByOrderId(int orderId);
	/** すべてのオーダーを取得 */
	public List<OrderTable> selectAllOrders();
	/** オーダーIDで受け渡しを取得 */
	public Integer selectServingStatusByOrderId(int orderId);
	/** servingStatusでorderを取得 */
	public List<OrderTable> selectOrdersByServingStatus(int servingStatus);
	
	public Boolean selectPaymentStatusByOrderId(int orderId);
	
	public String selectIdempotencyKeyByOrderId(int orderId);

	
	/** 注文を登録 */
	public int insertOrder(OrderTable order);
	

	/** 受け渡し状態の変更 */
	public int updateServingStatusByOrderId(int orderId,int servingStatus);
	/** paymentIdの挿入 */
	public int updatePaymentIdByOrderId(int orderId,String paymentId);
	/** 決済状況の更新 */
	public int updatePaymentStatusByOrderId(int orderId,boolean paymentStatus);
	
	public int updateIdempotencyKeyByOrderId(@Param("orderId") int orderId,@Param("idempotencyKey") String idempotencyKey);
	
}
