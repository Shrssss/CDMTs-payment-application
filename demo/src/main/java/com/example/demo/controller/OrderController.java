package com.example.demo.controller;

import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

import com.example.demo.service.OrderService;
import com.example.demo.dto.OrderRequest;
import com.example.demo.model.Order;
import com.example.demo.entity.OrderTable;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class OrderController {
	
	private final OrderService service;
    
    @PostMapping("/order/set") //order.jsonをDB登録
    public OrderTable createOrder(@RequestBody OrderRequest request) {
    	return service.createOrder(request);
    }
    
    @GetMapping("/order/get") //order.jsonを送信
    public Order getOrder(@PathVariable int orderId) {
    	return service.getOrder(orderId);
    }
    
    // @PostMapping("/order/{orderId}") //servingStatusを更新
    
    // @GetMapping("/order/{orderId}/status") //order.jsonを送信
    
    // @GetMapping("/order?status=READY") //order.jsonを送信
    
    // @GetMapping("/items") //Itemを取得
    
    // @PostMapping("/items/{itemId}") //ItemAvailをupdate
    
}
