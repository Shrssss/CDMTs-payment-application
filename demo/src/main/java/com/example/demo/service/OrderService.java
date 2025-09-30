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
    
    public String selectServingStatusByOrderId(int orderId) {
    	Integer status=mapper.selectServingStatusByOrderId(orderId);
    	String outline;
    	if(status==0) {
    		outline="調理中";
    	}else if(status==1) {
    		outline="受け渡し中";
    	}else if(status==2) {
    		outline="受け渡し済み";
    	}else {
    		outline="orderIdが存在しません: "+orderId;
    	}
    	
    	return outline;
    	
    }
    
    public int updateItemAvailabilityByItemId(int itemId,boolean available) {
    	return mapper.updateItemAvailabilityByItemId(itemId,available);
    }
    
    public int updateServingStatusByOrderId(int orderId,int servingStatus) {
    	return mapper.updateServingStatusByOrderId(orderId,servingStatus);
    }
    
    
    /** 注文の取得とDB保存　*/
    public OrderTable createOrder(OrderRequest request) {
    	OrderTable order=new OrderTable();
    	
    	order.setOrderId(request.getOrderId());
    	order.setOrderDate(request.getOrderDate());
    	order.setReservedTime(request.getReservedTime());
    	order.setServingStatus(request.getServingStatus());
    	order.setPaymentId(request.getPaymentId());
    	
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
    
    /** DBからの注文取得と受け渡し　*/
    public Order getOrder(int orderId) {
    	OrderTable table=selectOrdersByOrderId(orderId);
    	
    	Order order=new Order();
    	 List<OrderItemTable> items=selectOrderItemsByOrderId(orderId);
    	 
    	order.setOrderId(table.getOrderId());
    	order.setOrderDate(table.getOrderDate());
    	order.setReservedTime(table.getReservedTime());
    	order.setServingStatus(table.getServingStatus());
    	order.setPaymentId(table.getPaymentId());
    	
    	List<OrderItem> itemDtos=new ArrayList<>();
    	for(OrderItemTable item:items) {
    		OrderItem dto=new OrderItem();
    		dto.setItemId(item.getItemId());
    		dto.setQuantity(item.getQuantity());
    		
    		Item itemDto=selectItemByItemId(item.getItemId());
    		
    		dto.setItemName(itemDto.getItemName());
    		dto.setPrice(itemDto.getPrice());
    		dto.setAvailable(itemDto.getAvailable());
    		
    		itemDtos.add(dto);
    	}
    	
    	order.setItems(itemDtos);

    	return order;
    }
    
    /** Itemの在庫情報を更新し、Itemを返す　*/
    public Item toggleAvailablity(int itemId,boolean available) {
    	
    	Integer updated=updateItemAvailabilityByItemId(itemId,available);
    	
    	if(updated==0) {
    		 throw new IllegalArgumentException("指定されたitemIdが存在しません: "+itemId);
    	}
    	Item item=selectItemByItemId(itemId);
    	
    	return item;
    }
    
    /** orderの受け渡し情報を更新し、orderを返す　*/
    public OrderTable changeServingStatus(int orderId,boolean tf) {
    	
    	Integer status=mapper.selectServingStatusByOrderId(orderId);
    	
    	Integer updated;
    	
    	if(status==0) {
    		if(tf) {
    			updated=updateServingStatusByOrderId(orderId,status+1);
    		}else {
    			throw new IllegalArgumentException("この注文はすでに調理中です: "+orderId);
    		}
    	}else if(status==1) {
    		updated=(tf)?updateServingStatusByOrderId(orderId,status+1)
    				:updateServingStatusByOrderId(orderId,status-1);
    	}else if(status==2) {
    		if(tf) {
    			throw new IllegalArgumentException("この注文はすでに受け渡し済みです: "+orderId);
    		}else {
    			updated=updateServingStatusByOrderId(orderId,status-1);
    		}
    	}else throw new IllegalArgumentException("ServingStatusが不正です");
    	
    	
    	if(updated==0) {
   		 throw new IllegalArgumentException("指定されたorderIdが存在しません: "+orderId);
    	}
    	
    	return selectOrdersByOrderId(orderId);
    	
    }
    
}
