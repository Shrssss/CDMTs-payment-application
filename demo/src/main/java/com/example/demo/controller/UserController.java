package com.example.demo.controller;

import org.springframework.stereotype.Controller;

import com.example.demo.service.OrderService;

@Controller
public class UserController {
	private final OrderService service;
	
    public UserController(OrderService service) {
        this.service = service;
    }
	
}
