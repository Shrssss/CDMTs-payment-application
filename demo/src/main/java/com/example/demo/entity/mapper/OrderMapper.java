package com.example.demo.entity.mapper;

import org.apache.ibatis.annotations.Mapper;
import com.example.demo.entity.OrderTable;
import com.example.demo.entity.OrderItemTable;
import com.example.demo.model.Item;
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
}
