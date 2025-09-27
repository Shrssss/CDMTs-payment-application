package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.OrderRequest;
import com.example.demo.entity.OrderTable;
import com.example.demo.entity.mapper.OrderMapper;
import com.example.demo.model.OrderItem;
import com.example.demo.model.Item;
import com.example.demo.model.Order;
@Transactional
@Service
public class OrderService {
	private final OrderMapper mapper;
	
    public OrderService(OrderMapper mapper) {
        this.mapper = mapper;
    }
    public OrderTable selectOrdersByOrderId(long orderId){
    	return mapper.selectOrdersByOrderId(orderId);
    }
    public List<OrderItem> selectOrderItemsByOrderId(long orderId){
    	return mapper.selectOrderItemsByOrderId(orderId);
    }
    public List<OrderTable> selectAllOrders(){
    	return mapper.selectAllOrders();
    }
    public List<Item> selectAllItems(){
    	return mapper.selectAllItems();
    }
    public int updateItemAvailabilityByItemId(long itemId) {
    	return mapper.updateItemAvailabilityByItemId(itemId);
    }
    public int updateServingStatusByOrderId(long orderId) {
    	return mapper.updateServingStatusByOrderId(orderId);
    }
    
    
    /** 注文の取得とDB保存*/
    public Order createOrder(OrderRequest request) {
    	Order order=new Order();
    	order.setOrderId(request.getOrderId());
    	order.setOrderDate(request.getOrderDate());
    	order.setReservedTime(request.getReservedTime());
    	order.setServingStatus(request.getServingStatus());
    	order.setUserId(request.getUserId());
    	
    	mapper.insertOrder(order);
    	
    	for(OrderRequest.OrderItemRequest orderItemRequest:request.getItems()) {
    		OrderItem orderitem=new OrderItem();
    		orderitem.setOrderId(order.getOrderId());
    		orderitem.setItemId(orderItemRequest.getItemId());
    		orderitem.setQuantity(orderItemRequest.getQuantity());
    		
    		mapper.insertOrderItem(orderitem);
    	}
    	
    	return order;
    }
    
    /** DBからの注文取得と受け渡し*/
    public Order getOrder(long orderId) {
    	OrderTable table=mapper.selectOrdersByOrderId(orderId);
    	
    	Order order=new Order();
    	order.setOrderId(table.getOrderId());
    	order.setOrderDate(table.getOrderDate());
    	order.setReservedTime(table.getReservedTime());
    	order.setServingStatus(table.getServingStatus());
    	order.setUserId(table.getUserId());
    	
    	return order;
    }
}
