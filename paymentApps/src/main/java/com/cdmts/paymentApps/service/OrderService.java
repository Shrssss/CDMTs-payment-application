package com.cdmts.paymentApps.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cdmts.paymentApps.mapper.OrderItemMapper;
import com.cdmts.paymentApps.mapper.OrderMapper;
import com.cdmts.paymentApps.model.dto.OrderCreateRequest;
import com.cdmts.paymentApps.model.dto.OrderResponse;
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
    
}
