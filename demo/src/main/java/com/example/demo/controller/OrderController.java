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
//	private final OrderMapper mapper;
    
    @PostMapping("/!!holder")
    public Order createOrder(@RequestBody OrderRequest request) {
    	return service.createOrder(request);
    }

	
}
