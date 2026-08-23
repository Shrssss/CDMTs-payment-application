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

import com.cdmts.paymentApps.model.dto.ItemCreateRequest;
import com.cdmts.paymentApps.model.dto.ItemResponse;
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
    public List<ItemResponse> getItemsByItemIds(@RequestParam List<Long> itemIds) {
    
    	return itemService.getItemsByItemIds(itemIds);
    
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
    public List<ItemResponse> selectAllItems(){
    	
    	return itemService.selectAllItems();
    
    }

    /*
     * 在庫状況更新
     * 
     * メソッド名 	: updateAvailablity
     * 戻り値		: List<Long> itemIds
     * 引数		: List<Long> itemIds, Boolean available
     * 
     * 		PUT /api/items/update/available/{available}
     * 
     */
	@PutMapping("/update/available/{available}")
	public List<Long> updateAvailablity(@RequestParam List<Long> itemIds,@PathVariable Boolean available) {
		
		return itemService.updateAvailablity(itemIds,available);
		
	}
	
    /*
     * 商品登録
     * 
     * メソッド名 	: createItems
     * 戻り値		: List<Long> itemIds
     * 引数		: List<Item> items
     * 
     * 		POST /api/items
     * 
     */
	@PostMapping
	public List<Long> createItems(List<ItemCreateRequest>ItemDtos){
		
		return itemService.createItems(ItemDtos);
		
	}

}
