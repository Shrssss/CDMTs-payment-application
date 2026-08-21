package com.cdmts.paymentApps.controller;

import org.springframework.web.bind.annotation.*;

import com.cdmts.paymentApps.entity.OrderTable;
import com.cdmts.paymentApps.model.dto.OrderCreateRequest;
import com.cdmts.paymentApps.model.dto.OrderRequest;
import com.cdmts.paymentApps.model.entity.Item;
import com.cdmts.paymentApps.model.entity.Order;
import com.cdmts.paymentApps.service.OrderService;

import lombok.RequiredArgsConstructor;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "https://cdmts-pay.codemates.net")
@RequiredArgsConstructor
public class OrderController {
	
	private final OrderService orderService;
    
	
    /*
     * 注文作成
     * 
     * メソッド名 	: createOrder
     * 戻り値		: Long orderId
     * 引数		: OrderCreateRequest
     * 
     * 		POST /api/orders/set
     * 
     */
    @PostMapping("/set")
    public Long createOrder(@RequestBody OrderCreateRequest orderDto) {
    	return orderService.createOrder(orderDto);
    }
    
    /*
     * 注文取得
     * 
     * メソッド名 	: getOrders
     * 戻り値		: List<OrderResponse>
     * 引数		: List<Long> orderIds
     * 
     * 		Get /api/orders/get/byOrderIds
     * 
     */
    @GetMapping("/get/byOrderIds")
    public List<OrderResponse> getOrders(@RequestParam List<Long> orderIds) {
    	return orderService.getOrder(orderId);
    }
    
    /*
     * 提供状態更新
     * 
     * メソッド名 	: updateServingStatus
     * 戻り値		: Long orderId
     * 引数		: Long orderId, Short servingStatus
     * 
     * 		PUT /api/orders/update/servingStatus/{orderId}/{servingStatus}
     * 
     */
    @PutMapping("/update/servingStatus/{orderId}/{servingStatus}")
    public Long updateServingStatus(@PathVariable Long orderId,@PathVariable Short servingStatus) {
    	return orderService.changeServingStatus(orderId,servingStatus);
    }
    
    /*
     * 提供状態更新
     * 
     * メソッド名 	: updatePaymentStatus
     * 戻り値		: Long orderId
     * 引数		: Long orderId, Boolean paymentStatus
     * 
     * 		PUT /api/orders/update/paymentStatus/{orderId}/{paymentStatus}
     * 
     */
	@PutMapping("/update/paymentStatus/{orderId}/{paymentStatus}")
	public Long updatePaymentStatus(@PathVariable Long orderId,@PathVariable Boolean paymentStatus) {
		return orderService.changePaymentStatus(orderId,paymentStatus);
	}
    
    /*
     * 注文からの提供状態取得
     * 
     * メソッド名 	: getServingStatusByOrderIds
     * 戻り値		: Short servingStatus
     * 引数		: List<Long> orderIds
     * 
     * 		GET /api/orders/get/servingStatus
     * 
     */
    @GetMapping("/get/servingStatus")
    public Short getServingStatusByOrderIds(@RequestParam List<Long> orderIds) {
    	return orderService.selectServingStatusByOrderId(orderId);
    }
	
    /*
     * 提供状態からの注文取得
     * 
     * メソッド名 	: getServingStatusByOrderIds
     * 戻り値		: List<OrderResponse> orderResponses
     * 引数		: Short servingStatus
     * 
     * 		GET /api/orders/get/servingStatus
     * 
     */
	@GetMapping("/get/byServingStatus/{servingStatus}")
	public List<OrderResponse> selectOrdersByServingStatus(@PathVariable Short servingStatus){
		return orderService.selectOrdersByServingStatus(servingStatus);
	}
	
}
