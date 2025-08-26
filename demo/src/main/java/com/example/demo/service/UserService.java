package com.example.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.demo.entity.UserTable;
import com.example.demo.entity.mapper.UserMapper;
import com.example.demo.model.Order;
import com.example.demo.model.OrderItem;
@Transactional
@Service
public class UserService {
	private final UserMapper mapper;
	
    public UserService(UserMapper mapper) {
        this.mapper = mapper;
    }

    public List<UserTable> selectById(long userId){
    	return mapper.selectById(userId);
    }
    public List<Order> selectOrdersByUserId(long userId){
    	return mapper.selectOrdersByUserId(userId);
    }
    public List<OrderItem> selectOrderItemsByOrderId(long orderId){
    	return mapper.selectOrderItemsByOrderId(orderId);
    }
    
    //追加予定
    
}
