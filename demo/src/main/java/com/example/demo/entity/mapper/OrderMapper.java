package com.example.demo.entity.mapper;

import org.apache.ibatis.annotations.Mapper;
import com.example.demo.entity.OrderTable;
import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import com.example.demo.model.Item;
import java.util.List;
@Mapper
public interface OrderMapper {
	
	/** オーダーIDでオーダーの情報を取得 */
	public OrderTable selectOrdersByOrderId(long orderId);
	/** オーダーIDで注文商品の明細を取得 */
	public List<OrderItem> selectOrderItemsByOrderId(long orderId);
	/** すべてのオーダーを取得 */
	public List<OrderTable> selectAllOrders();
	/** すべての商品を取得 */
	public List<Item> selectAllItems();
	
	/** 注文を登録 */
	public int insertOrder(Order order);
	/** 注文商品を登録 */
	public int insertOrderItem(OrderItem item);
	/** 商品を登録（事前登録） */
	public int insertItem(Item item);
	
	/** 在庫情報を更新 */
	public int updateItemAvailabilityByItemId(long itemId);
	/** 受け渡し状態の変更 */
	public int updateServingStatusByOrderId(long orderId);
}
