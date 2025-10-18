package com.cdmts.paymentApps.service;

import java.util.List;
import java.util.ArrayList;

import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cdmts.paymentApps.dto.OrderRequest;
import com.cdmts.paymentApps.entity.OrderItemTable;
import com.cdmts.paymentApps.entity.OrderTable;
import com.cdmts.paymentApps.entity.mapper.OrderMapper;
import com.cdmts.paymentApps.model.Item;
import com.cdmts.paymentApps.model.Order;
import com.cdmts.paymentApps.model.OrderItem;
@Transactional
@Service
public class OrderService {
	private final OrderMapper mapper;
	
    public OrderService(OrderMapper mapper) {
        this.mapper=mapper;
    }
    
    public OrderTable selectOrdersByOrderId(@Param("orderId") int orderId){
    	return mapper.selectOrdersByOrderId(orderId);
    }
    
    public List<OrderItemTable> selectOrderItemsByOrderId(@Param("orderId") int orderId){
    	return mapper.selectOrderItemsByOrderId(orderId);
    }
    
	public Item selectItemByItemId(@Param("itemId") int itemId){
		return mapper.selectItemByItemId(itemId);
	}
	
    public List<OrderTable> selectAllOrders(){
    	return mapper.selectAllOrders();
    }
    
    public List<Item> selectAllItems(){
    	return mapper.selectAllItems();
    }
    
    public int selectServingStatusByOrderId(@Param("orderId") int orderId) {
    	return mapper.selectServingStatusByOrderId(orderId);
    }
    
    public int updateIdempotencyKeyByOrderId(@Param("orderId") int orderId,String idempotencyKey) {
    	return mapper.updateIdempotencyKeyByOrderId(orderId,idempotencyKey);
    }
    
    public String selectIdempotencyKeyByOrderId(int orderId) {
        return mapper.selectIdempotencyKeyByOrderId(orderId);
    }
    
    public List<Order> selectOrdersByServingStatus(int servingStatus) {
    	
    	List<OrderTable> orderTable=mapper.selectOrdersByServingStatus(servingStatus);
    	
    	List<Order> orders=new ArrayList<>();
    	
    	for(OrderTable orderDto:orderTable) {
    		
    		Order order=new Order();
    		
    		order.setOrderId(orderDto.getOrderId());
    		order.setOrderDate(orderDto.getOrderDate());
    		order.setReservedTime(orderDto.getReservedTime());
    		order.setServingStatus(orderDto.getServingStatus());
    		order.setPaymentId(orderDto.getPaymentId());
    		order.setPaymentStatus(orderDto.getPaymentStatus());
    		
    		List<OrderItemTable> orderItemTable=selectOrderItemsByOrderId(orderDto.getOrderId());
    		
    		List<OrderItem> orderItems=new ArrayList<>();
    		
    		for(OrderItemTable orderItemDto:orderItemTable) {
    			
    			OrderItem orderItem=new OrderItem();
    			
    			Item itemDto=selectItemByItemId(orderItemDto.getItemId());
        		
    			orderItem.setOrderItemId(orderItemDto.getOrderItemId());
    			orderItem.setOrderId(orderItemDto.getOrderId());
    			orderItem.setItemId(orderItemDto.getItemId());
    			orderItem.setQuantity(orderItemDto.getQuantity());
    			
    			orderItem.setItemName(itemDto.getItemName());
    			orderItem.setPrice(itemDto.getPrice());
    			orderItem.setAvailable(itemDto.getAvailable());
    			
    			orderItem.setItem(itemDto);
    			
    			orderItems.add(orderItem);
    			
    		}
    		
			order.setItems(orderItems);
    		
    		orders.add(order);
    	}
    	
    	
    	return orders;
    }
    
    public boolean selectPaymentStatusByOrderId(int orderId) {
    	return mapper.selectPaymentStatusByOrderId(orderId);
    }
    
    
    public int updateItemAvailabilityByItemId(int itemId,boolean available) {
    	return mapper.updateItemAvailabilityByItemId(itemId,available);
    }
    
    public int updateServingStatusByOrderId(int orderId,int servingStatus) {
    	return mapper.updateServingStatusByOrderId(orderId,servingStatus);
    }
    public int updatePaymentStatusByOrderId(int orderId,boolean paymentStatus) {
    	return mapper.updatePaymentStatusByOrderId(orderId,paymentStatus);
    }
    public int updatePaymentIdByOrderId(int orderId,String paymentId) {
    	return mapper.updatePaymentIdByOrderId(orderId,paymentId);
    	
    }
    
    
    /** 注文の取得とDB保存　*/
    public OrderTable createOrder(OrderRequest request) {
    	OrderTable order=new OrderTable();
    	
    	//order.setOrderId(request.getOrderId());
    	order.setOrderDate(request.getOrderDate());
    	order.setReservedTime(request.getReservedTime());
    	order.setServingStatus(0);
    	//order.setPaymentId(request.getPaymentId()); //nullAble
    	order.setPaymentStatus(false);
    	
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
    	order.setPaymentStatus(table.getPaymentStatus());
    	
    	List<OrderItem> itemDtos=new ArrayList<>();
    	for(OrderItemTable item:items) {
    		OrderItem dto=new OrderItem();
    		dto.setOrderItemId(item.getOrderItemId());
    		dto.setOrderId(item.getOrderId());
    		dto.setItemId(item.getItemId());
    		dto.setQuantity(item.getQuantity());
    		dto.setItem(selectItemByItemId(item.getItemId()));
    		
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
    public List<Item> toggleAvailablity(int itemId,boolean available) {
    	
    	List<Item> items=new ArrayList<>();
    	
    	if(itemId%10==0) {
    		
    		int[] itemIds= {itemId,itemId+31,itemId+32,itemId+33,itemId+34};
    		int updated=0;
    				
    		for(int i=0;i<5;i++) {
    			
    			updated+=updateItemAvailabilityByItemId(itemIds[i],available);
    			
    			if(updated==0) {
           		 throw new IllegalArgumentException("指定されたitemIdが存在しません: "+itemIds[i]);
    			}
            	
            	items.add(selectItemByItemId(itemId));
    			
    		}

    	}else {
    		
    		int[] itemIds={itemId,90+itemId%10};
    		
    		int updated=0;
    		
    		for(int i=0;i<2;i++) {
    			updated+=updateItemAvailabilityByItemId(itemIds[i],available);
    			
    			if(updated==0) {
           		 throw new IllegalArgumentException("指定されたitemIdが存在しません: "+itemIds[i]);
    			}
    			
    			items.add(selectItemByItemId(itemIds[i]));
    			
    		}
    	}
    	
    	return items;
    	
    }
    
    /** orderの受け渡し情報を更新し、orderを返す　*/
    public OrderTable changeServingStatus(int orderId,int servingStatus) {
    	
    	int status=mapper.selectServingStatusByOrderId(orderId);
    	
    	int updated;
    	
    	if(status==0) {
    		
    		if(servingStatus==1) {
    			updated=updateServingStatusByOrderId(orderId,servingStatus);
    		}else {
    			throw new IllegalArgumentException("入力値が不正です: "+servingStatus);
    		}
    		
    	}else if(status==1) {
    		
    		if(servingStatus==0||servingStatus==2) {
    			updated=updateServingStatusByOrderId(orderId,servingStatus);
    		}else {
    			throw new IllegalArgumentException("入力値が不正です: "+servingStatus);
    		}
    		
    	}else if(status==2) {
    		
    		if(servingStatus==1) {
    			updated=updateServingStatusByOrderId(orderId,servingStatus);
    		}else {
    			throw new IllegalArgumentException("入力値が不正です: "+servingStatus);
    		}
    		
    	}else throw new IllegalArgumentException("servingStatusが不正です");
    	
    	
    	if(updated==0) {
   		 throw new IllegalArgumentException("指定されたorderIdが存在しません: "+orderId);
    	}
    	
    	return selectOrdersByOrderId(orderId);
    	
    }
    
    
    /** orderの決済情報を更新し、orderを返す　*/
    public OrderTable changePaymentStatus(int orderId,boolean paymentStatus) {
    	if(paymentStatus) {
    		int updated=updatePaymentStatusByOrderId(orderId,paymentStatus);
    		
    		if(updated==0) {
    			throw new IllegalArgumentException("指定されたorderIdが存在しません: "+orderId);
    		}
        	
        	return selectOrdersByOrderId(orderId);
        	
    	}else {
    		throw new IllegalArgumentException("決済情報は不可逆です。入力:"+paymentStatus);
    	}
    }
    
}
