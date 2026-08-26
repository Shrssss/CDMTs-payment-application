package com.cdmts.paymentApps.service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cdmts.paymentApps.mapper.OrderItemMapper;
import com.cdmts.paymentApps.mapper.OrderMapper;
import com.cdmts.paymentApps.model.dto.OrderCreateRequest;
import com.cdmts.paymentApps.model.dto.OrderResponse;
import com.cdmts.paymentApps.model.dto.OrderedItemRow;
import com.cdmts.paymentApps.model.entity.Order;
import com.cdmts.paymentApps.model.entity.OrderItem;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OrderService {
	
	private final OrderMapper orderMapper;
	
	private final OrderItemMapper orderItemMapper;
	
	
	
	public OrderResponse toResponse(Order order,List<OrderResponse.OrderedItem> orderedItems) {
		return new OrderResponse(
						order.getOrderId(),
						order.getOrderDate(),
						order.getReservedTime(),
						order.getServingStatus(),
						orderedItems
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

        List<OrderedItemRow> itemRows=orderMapper.selectOrderedItemsByOrderIds(orderIds);

        Map<Long, List<OrderResponse.OrderedItem>> itemsByOrderId = itemRows.stream()
                .collect(Collectors.groupingBy(
                        OrderedItemRow::getOrderId,
                        Collectors.mapping(
                                row -> new OrderResponse.OrderedItem(
                                        row.getItemId(),row.getName(),row.getQuantity()),
                                Collectors.toList()
                        )
                ));

        return orderEntities.stream()
                .map(order->toResponse(
                        order,
                        itemsByOrderId.getOrDefault(order.getOrderId(),List.of())
                ))
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

        List<Long> orderIds=orderEntities.stream()
                .map(Order::getOrderId)
                .toList();

        List<OrderedItemRow> itemRows=orderIds.isEmpty()
        									?List.of():orderMapper.selectOrderedItemsByOrderIds(orderIds);

        Map<Long, List<OrderResponse.OrderedItem>> itemsByOrderId=itemRows.stream()
                .collect(Collectors.groupingBy(
                        OrderedItemRow::getOrderId,
                        Collectors.mapping(
                                row->new OrderResponse.OrderedItem(
                                        row.getItemId(),row.getName(),row.getQuantity()),
                                Collectors.toList()
                        )
                ));

        return orderEntities.stream()
                .map(order->toResponse(
                        order,
                        itemsByOrderId.getOrDefault(order.getOrderId(),List.of())
                ))
                .toList();
    }
    
}
