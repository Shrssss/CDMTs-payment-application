package com.example.demo.service;

import java.util.List;
import java.util.ArrayList;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.dto.OrderRequest;
import com.example.demo.entity.OrderTable;
import com.example.demo.entity.OrderItemTable;
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
    public OrderTable selectOrdersByOrderId(int orderId){
    	return mapper.selectOrdersByOrderId(orderId);
    }
    public List<OrderItemTable> selectOrderItemsByOrderId(int orderId){
    	return mapper.selectOrderItemsByOrderId(orderId);
    }
	public Item selectItemByItemId(int itemId){
		return mapper.selectItemByItemId(itemId);
	}
    public List<OrderTable> selectAllOrders(){
    	return mapper.selectAllOrders();
    }
    public List<Item> selectAllItems(){
    	return mapper.selectAllItems();
    }
    public int updateItemAvailabilityByItemId(int itemId) {
    	return mapper.updateItemAvailabilityByItemId(itemId);
    }
    public int updateServingStatusByOrderId(int orderId) {
    	return mapper.updateServingStatusByOrderId(orderId);
    }
    
    
    /** 注文の取得とDB保存*/
    public OrderTable createOrder(OrderRequest request) {
    	OrderTable order=new OrderTable();
    	
    	order.setOrderId(request.getOrderId());
    	order.setOrderDate(request.getOrderDate());
    	order.setReservedTime(request.getReservedTime());
    	order.setServingStatus(request.getServingStatus());
//    	order.setUserId(request.getUserId());
    	
    	mapper.insertOrder(order);
    	
    	for(OrderRequest.OrderItemRequest orderItemRequest:request.getItems()) {
    		OrderItemTable orderitem=new OrderItemTable();
    		orderitem.setOrderId(order.getOrderId());
    		orderitem.setItemId(orderItemRequest.getItemId());
    		orderitem.setQuantity(orderItemRequest.getQuantity());
    		
    		mapper.insertOrderItem(orderitem);
    	}
    	
    	return order;
    }
    
    /** DBからの注文取得と受け渡し*/
    public Order getOrder(int orderId) {
    	OrderTable table=mapper.selectOrdersByOrderId(orderId);
    	
    	Order order=new Order();
    	 List<OrderItemTable> items = mapper.selectOrderItemsByOrderId(orderId);
    	 
    	order.setOrderId(table.getOrderId());
    	order.setOrderDate(table.getOrderDate());
    	order.setReservedTime(table.getReservedTime());
    	order.setServingStatus(table.getServingStatus());
//    	order.setUserId(table.getUserId());
    	
    	List<OrderItem> itemDtos=new ArrayList<>();
    	for(OrderItemTable item:items) {
    		OrderItem dto=new OrderItem();
    		dto.setItemId(item.getItemId());
    		dto.setQuantity(item.getQuantity());
    		
    		Item itemDto=mapper.selectItemByItemId(item.getItemId());
    		
    		dto.setItemName(itemDto.getItemName());
    		dto.setPrice(itemDto.getPrice());
    		dto.setAvailable(itemDto.getAvailable());
    		
    		itemDtos.add(dto);
    	}
    	
    	order.setItems(itemDtos);

    	return order;
    }
}
