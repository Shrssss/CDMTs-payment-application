package com.example.demo.entity.mapper;

import org.apache.ibatis.annotations.Mapper;
import com.example.demo.entity.UserTable;
import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
import java.util.List;
@Mapper
public interface UserMapper {
	/** ユーザIDでユーザと注文情報を取得 */
	public List<UserTable> selectById(long userId);

	public List<Order> selectOrdersByUserId(long userId);
	
	public List<OrderItem> selectOrderItemsByOrderId(long orderId);
	/** ユーザを登録 */
	public int insert(UserTable userTable);
	/** 注文を登録 */
	public int insertOrder(Order order);
	/** 注文商品を登録 */
	public int insertOrderItem(OrderItem item);
}
