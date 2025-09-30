package com.example.demo.controller;

import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

import com.example.demo.service.OrderService;
import com.example.demo.dto.OrderRequest;
import com.example.demo.model.Order;
import com.example.demo.model.Item;
import com.example.demo.entity.OrderTable;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class OrderController {
	
	private final OrderService service;
    
    @PostMapping("/order/set") //フロントから受け取ったorder.jsonをDB登録
    public OrderTable createOrder(@RequestBody OrderRequest request) {
    	return service.createOrder(request);
    }
    
    @GetMapping("/order/get/{orderId}") //order.jsonをフロントに送信
    public Order getOrder(@PathVariable int orderId) {
    	return service.getOrder(orderId);
    }
    
    @PostMapping("/order/set/status/{orderId}/{tf}") //orderId,tfをもとにservingStatusを更新 （処理内容 (tf)? statusを次の状態へ : statusを前の状態へ）
    public OrderTable changeServingStatus(int orderId,boolean tf) {
    	return service.changeServingStatus(orderId,tf);
    }
    
    @GetMapping("/order/get/status/{orderId}") //servingStatusをフロントに送信
    public String selectServingStatusByOrderId(@PathVariable int orderId) {
    	return service.selectServingStatusByOrderId(orderId);
    }
    
    @GetMapping("/items/get/{itemId}") //Item.jsonをフロントに送信
    public Item selectItemByItemId(@PathVariable int itemId) {
    	return service.selectItemByItemId(itemId);
    }

	@PostMapping("/items/set/available/{itemId}/{available}") //itemId,availableをもとにItemAvailを更新
	public Item toggleAvailablity(@PathVariable int itemId,@PathVariable boolean available) {
		return service.toggleAvailablity(itemId,available);
	}
     
}
