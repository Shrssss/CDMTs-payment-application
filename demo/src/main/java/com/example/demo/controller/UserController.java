package com.example.demo.controller;

import org.springframework.stereotype.Controller;

import com.example.demo.service.UserService;

@Controller
public class UserController {
	private final UserService service;
	
    public UserController(UserService service) {
        this.service = service;
    }
	
}
