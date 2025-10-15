package com.cdmts.paymentApps.service;

import java.util.List;
import java.util.ArrayList;

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
    
    public int selectServingStatusByOrderId(int orderId) {
    	return mapper.selectServingStatusByOrderId(orderId);
    }
    
    public List<OrderTable> selectOrdersByServingStatus(int servingStatus) {
    	return mapper.selectOrdersByServingStatus(servingStatus);
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
    		
    		int[] itemIds= {itemId,40+itemId%10,50+itemId%10};
    		int updated=0;
    		
    		for(int i=0;i<3;i++) {
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
    public OrderTable changeServingStatus(int orderId,boolean tf) {
    	
    	int status=mapper.selectServingStatusByOrderId(orderId);
    	
    	int updated;
    	
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
