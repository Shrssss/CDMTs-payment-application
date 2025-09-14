package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entity.OrderTable;
import com.example.demo.entity.mapper.OrderMapper;
import com.example.demo.model.OrderItem;
@Transactional
@Service
public class OrderService {
	private final OrderMapper mapper;
	
    public OrderService(OrderMapper mapper) {
        this.mapper = mapper;
    }
    public List<OrderTable> selectOrdersByOrderId(long orderId){
    	return mapper.selectOrdersByOrderId(orderId);
    }
    public List<OrderItem> selectOrderItemsByOrderId(long orderId){
    	return mapper.selectOrderItemsByOrderId(orderId);
    }
    public List<OrderTable> selectAllOrders(){
    	return mapper.selectAllOrders();
    }
}
