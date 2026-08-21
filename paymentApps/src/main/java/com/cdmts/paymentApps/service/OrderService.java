package com.cdmts.paymentApps.service;

import java.util.List;
import java.util.ArrayList;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cdmts.paymentApps.mapper.OrderItemMapper;
import com.cdmts.paymentApps.mapper.OrderMapper;
import com.cdmts.paymentApps.model.dto.OrderCreateRequest;
import com.cdmts.paymentApps.model.dto.OrderRequest;
import com.cdmts.paymentApps.model.dto.OrderResponse;
import com.cdmts.paymentApps.model.entity.Item;
import com.cdmts.paymentApps.model.entity.Order;
import com.cdmts.paymentApps.model.entity.OrderItem;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderService {
	
	private final OrderMapper orderMapper;
	
	private final OrderItemMapper orderItemMapper;
	
	
	
	public OrderResponse toResponse(Order order) {
		return new OrderResponse(
						order.getOrderId(),
						order.getOrderDate(),
						order.getReservedTime(),
						order.getServingStatus()
				);
	}
    

    
    @Transactional
    public Long createOrder(OrderCreateRequest orderDto) {
    	
    	Order orderEntity=orderDto.toEntity();
    	
    	int orderInsertCount=orderMapper.insertOrder(orderEntity);
    	
    	if(orderInsertCount!=1) throw new IllegalArgumentException("Expected 1 Order insert row but was "+orderInsertCount+".");
    	
    	List<OrderItem> orderItemEntities=orderDto.getItems().stream()
    										.map(item->item.toEntity(orderEntity.getOrderId()))
    										.toList();
    	
    	int orderItemInsertCount=orderItemMapper.insertOrderItems(orderItemEntities);
    	
    	if(orderItemInsertCount<=0) throw new IllegalArgumentException("Expected over 0 OrderItems insert row but was "+orderItemInsertCount+".");
    	
    	return orderEntity.getOrderId();

    }
    
    public List<OrderResponse> getOrdersByIds(List<Long> orderIds) {
    	
    	List<Order> orderEntities=orderMapper.selectOrdersByOrderIds(orderIds);
    	
    	return orderEntities.stream()
    			.map(order->toResponse(order))
    			.toList();
    	
    }
    
    @Transactional
    public Long updateServingStatus(Long orderId,Short servingStatus) {
    	
    	int updateCount=orderMapper.updateServingStatusByOrderId(orderId, servingStatus);
    	
    	if(updateCount!=1) throw new IllegalArgumentException("Expected 1 update row but was "+updateCount+".");
    	
    	return orderId;
    	
    }
    
    @Transactional
    public Long updatePaymentStatus(Long orderId,Boolean paymentStatus) {
    	
    	int updateCount=orderMapper.updatePaymentStatusByOrderId(orderId, paymentStatus);
    	
    	if(updateCount!=1) throw new IllegalArgumentException("Expected 1 update row but was "+updateCount+".");
    	
    	return orderId;
    
    }
    
    public Short getServingStatusByOrderId(Long orderId) {
    	return orderMapper.selectServingStatusByOrderId(orderId);
    }
    
    public List<OrderResponse> getOrdersByServingStatus(Short servingStatus) {
    	
    	List<Order> orderEntities=orderMapper.selectOrdersByServingStatus(servingStatus);
    	
    	return orderEntities.stream()
    			.map(order->toResponse(order))
    			.toList();
    	
    }
    
    
    
//  public OrderTable selectOrdersByOrderId(@Param("orderId") int orderId){
//	return mapper.selectOrdersByOrderId(orderId);
//}
//
//public List<OrderItemTable> selectOrderItemsByOrderId(@Param("orderId") int orderId){
//	return mapper.selectOrderItemsByOrderId(orderId);
//}
//
//public List<OrderTable> selectAllOrders(){
//	return mapper.selectAllOrders();
//}
//
//public int updateIdempotencyKeyByOrderId(@Param("orderId") int orderId,String idempotencyKey) {
//	return mapper.updateIdempotencyKeyByOrderId(orderId,idempotencyKey);
//}
//
//public String selectIdempotencyKeyByOrderId(int orderId) {
//    return mapper.selectIdempotencyKeyByOrderId(orderId);
//}
//
//public boolean selectPaymentStatusByOrderId(int orderId) {
//	return mapper.selectPaymentStatusByOrderId(orderId);
//}
//
//public int updateItemAvailabilityByItemId(int itemId,boolean available) {
//	return mapper.updateItemAvailabilityByItemId(itemId,available);
//}
//
//public int updateServingStatusByOrderId(int orderId,int servingStatus) {
//	return mapper.updateServingStatusByOrderId(orderId,servingStatus);
//}
//public int updatePaymentStatusByOrderId(int orderId,boolean paymentStatus) {
//	return mapper.updatePaymentStatusByOrderId(orderId,paymentStatus);
//}
//public int updatePaymentIdByOrderId(int orderId,String paymentId) {
//	return mapper.updatePaymentIdByOrderId(orderId,paymentId);
//	
//}
    
    
}
