package com.cdmts.paymentApps.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.cdmts.paymentApps.entity.OrderItemTable;

@Mapper
public interface OrderItemMapper {
	
	/** オーダーIDで注文商品の明細を取得 */
	public List<OrderItemTable> selectOrderItemsByOrderId(int orderId);
	
	/** 注文商品を登録 */
	public int insertOrderItem(OrderItemTable item);

}
