package com.cdmts.paymentApps.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.cdmts.paymentApps.model.entity.OrderItem;

@Mapper
public interface OrderItemMapper {
	
	/** オーダーIDで注文商品の明細を取得 */
	public List<OrderItem> selectOrderItemsByOrderId(Long orderId);
	
	/** 注文商品を登録 */
	public int insertOrderItems(List<OrderItem> items);

}
