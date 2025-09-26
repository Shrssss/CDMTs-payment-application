package com.example.demo.controller;

import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;

import com.example.demo.service.OrderService;
import com.example.demo.dto.OrderRequest;
import com.example.demo.model.Order;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class OrderController {
	
	private final OrderService service;
    
    @PostMapping("/!!holder") //order.jsonをDB登録
    public Order createOrder(@RequestBody OrderRequest request) {
    	return service.createOrder(request);
    }
    
     @GetMapping("/!!holder") //order.jsonを送信
     public Order getOrder(@PathVariable long orderId) {
    	 return service.getOrder(orderId);
     }
}
