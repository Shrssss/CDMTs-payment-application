package com.cdmts.paymentApps.controller;

import org.springframework.web.bind.annotation.*;

import com.cdmts.paymentApps.dto.OrderRequest;
import com.cdmts.paymentApps.entity.OrderTable;
import com.cdmts.paymentApps.model.Item;
import com.cdmts.paymentApps.model.Order;
import com.cdmts.paymentApps.service.OrderService;

import lombok.RequiredArgsConstructor;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class OrderController {
	
	private final OrderService service;
    
    @PostMapping("/order/set") //フロントから受け取ったorder.jsonをDB登録
    public OrderTable createOrder(@RequestBody OrderRequest request) {
    	return service.createOrder(request);
    }
    
    @GetMapping("/order/get/byorderId/{orderId}") //order.jsonをフロントに送信
    public Order getOrder(@PathVariable int orderId) {
    	return service.getOrder(orderId);
    }
    
    @PostMapping("/order/set/servingStatus/{orderId}/{tf}") //orderId,tfをもとにservingStatusを更新 （処理内容 (tf)? statusを次の状態へ : statusを前の状態へ）
    public OrderTable changeServingStatus(@PathVariable int orderId,@PathVariable boolean tf) {
    	return service.changeServingStatus(orderId,tf);
    }
    
	@PostMapping("/order/set/paymentStatus/{orderId}/{paymentStatus}")
	public OrderTable changePaymentStatus(@PathVariable int orderId,@PathVariable boolean paymentStatus) {
		return service.changePaymentStatus(orderId,paymentStatus);
	}
     
    @GetMapping("/order/get/status/{orderId}") //servingStatusをフロントに送信
    public int selectServingStatusByOrderId(@PathVariable int orderId) {
    	return service.selectServingStatusByOrderId(orderId);
    }
    
    @GetMapping("/items/get/byitemId/{itemId}") //Item.jsonをフロントに送信
    public Item selectItemByItemId(@PathVariable int itemId) {
    	return service.selectItemByItemId(itemId);
    }
    
    @GetMapping("/item/get/allItems")
    public List<Item> selectAllItems(){
    	return service.selectAllItems();
    }

	@PostMapping("/items/set/available/{itemId}/{available}") //itemId,availableをもとにItemAvailを更新
	public List<Item> toggleAvailablity(@PathVariable int itemId,@PathVariable boolean available) {
		return service.toggleAvailablity(itemId,available);
	}
	
	@GetMapping("order/get/bystatus/{servingStatus}") //servingStatusをもとにorderをフロントに送信
	public List<OrderTable> selectOrdersByServingStatus(@PathVariable int servingStatus){
		return service.selectOrdersByServingStatus(servingStatus);
	}
	
}
