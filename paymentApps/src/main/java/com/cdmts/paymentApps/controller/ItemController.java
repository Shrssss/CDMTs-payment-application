package com.cdmts.paymentApps.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cdmts.paymentApps.model.entity.Item;
import com.cdmts.paymentApps.service.ItemService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/items")
@CrossOrigin(origins = "https://cdmts-pay.codemates.net")
@RequiredArgsConstructor
public class ItemController {
	
	private final ItemService itemService;
	
    /*
     * 商品検索
     * 
     * メソッド名 	: createOrder
     * 戻り値		: Long orderId
     * 引数		: OrderCreateRequest
     * 
     * 		GET /api/items
     * 
     */
    @GetMapping("/get/byItemIds")
    public List<Item> getItemsByItemIds(@RequestParam List<Long> itemIds) {
    	return itemService.selectItemByItemId(itemId);
    }
    
    /*
     * 全商品取得
     * 
     * メソッド名 	: selectAllItems
     * 戻り値		: List<Item>
     * 引数		: 
     * 
     * 		GET /api/items/get/allItems
     * 
     */
    @GetMapping("/get/allItems")
    public List<Item> selectAllItems(){
    	return itemService.selectAllItems();
    }

    /*
     * 在庫状況更新
     * 
     * メソッド名 	: updateAvailablity
     * 戻り値		: List<Item>
     * 引数		: List<Long> itemId, Boolean available
     * 
     * 		PUT /api/items/update/available/{available}
     * 
     */
	@PutMapping("/update/available/{available}")
	public List<Item> updateAvailablity(@RequestParam List<Long> itemIds,@PathVariable Boolean available) {
		return itemService.toggleAvailablity(itemId,available);
	}

}
