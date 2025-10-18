package com.cdmts.paymentApps.entity.mapper;

import org.apache.ibatis.annotations.Mapper;

import com.cdmts.paymentApps.entity.OrderItemTable;
import com.cdmts.paymentApps.entity.OrderTable;
import com.cdmts.paymentApps.model.Item;

import java.util.List;
@Mapper
public interface OrderMapper {
	
	/** オーダーIDでオーダーの情報を取得 */
	public OrderTable selectOrdersByOrderId(int orderId);
	/** オーダーIDで注文商品の明細を取得 */
	public List<OrderItemTable> selectOrderItemsByOrderId(int orderId);
	/** アイテムIDで商品を取得 */
	public Item selectItemByItemId(int itemId);
	/** すべてのオーダーを取得 */
	public List<OrderTable> selectAllOrders();
	/** すべての商品を取得 */
	public List<Item> selectAllItems();
	/** オーダーIDで受け渡しを取得 */
	public Integer selectServingStatusByOrderId(int orderId);
	/** servingStatusでorderを取得 */
	public List<OrderTable> selectOrdersByServingStatus(int servingStatus);
	
	public Boolean selectPaymentStatusByOrderId(int orderId);
	
	public String selectIdempotencyKeyByOrderId(int orderId);

	
	/** 注文を登録 */
	public int insertOrder(OrderTable order);
	/** 注文商品を登録 */
	public int insertOrderItem(OrderItemTable item);
	/** 商品を登録（事前登録） */
	public int insertItem(Item item);
	
	/** 在庫情報を更新 */
	public int updateItemAvailabilityByItemId(int itemId,boolean available);
	/** 受け渡し状態の変更 */
	public int updateServingStatusByOrderId(int orderId,int servingStatus);
	/** paymentIdの挿入 */
	public int updatePaymentIdByOrderId(int orderId,String paymentId);
	/** 決済状況の更新 */
	public int updatePaymentStatusByOrderId(int orderId,boolean paymentStatus);
	
	public int updateIdempotencyKeyByOrderId(int orderId,String IdempotencyKey);
	
}
