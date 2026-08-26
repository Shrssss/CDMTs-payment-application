package com.cdmts.paymentApps.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.cdmts.paymentApps.model.dto.OrderResponse;
import com.cdmts.paymentApps.model.dto.OrderedItemRow;
import com.cdmts.paymentApps.model.entity.Item;
import com.cdmts.paymentApps.model.entity.Order;

import java.util.List;

@Mapper
public interface OrderMapper {
	
	/** オーダーIDでオーダーの情報を取得 */
	public List<Order> selectOrdersByOrderIds(@Param("orderIds")List<Long> orderIds);
	/** すべてのオーダーを取得 */
	public List<Order> selectAllOrders();
	/** オーダーIDで受け渡しを取得 */
	public Short selectServingStatusByOrderId(Long orderId);
	/** servingStatusでorderを取得 */
	public List<Order> selectOrdersByServingStatus(Short servingStatus);
	
	public List<OrderedItemRow> selectOrderedItemsByOrderIds(@Param("orderIds")List<Long>ids);

	
	/** 注文を登録 */
	public int insertOrder(Order order);
	

	/** 受け渡し状態の変更 */
	public int updateServingStatusByOrderId(@Param("orderId")Long orderId,@Param("servingStatus")Short servingStatus);
	/** 決済状況の更新 */
	public int updatePaymentStatusByOrderId(@Param("orderId")Long orderId,@Param("paymentStatus")Boolean paymentStatus);

	
}
