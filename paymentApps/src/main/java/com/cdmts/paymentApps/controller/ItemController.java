package com.cdmts.paymentApps.controller;

import java.util.List;

import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
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
	
    @GetMapping("/get/byitemId/{itemId}") //Item.jsonをフロントに送信
    public Item selectItemByItemId(@PathVariable int itemId) {
    	return itemService.selectItemByItemId(itemId);
    }
    
    @GetMapping("/get/allItems")
    public List<Item> selectAllItems(){
    	return itemService.selectAllItems();
    }

	@PostMapping("/set/available/{itemId}/{available}") //itemId,availableをもとにItemAvailを更新
	public List<Item> toggleAvailablity(@PathVariable int itemId,@PathVariable boolean available) {
		return itemService.toggleAvailablity(itemId,available);
	}

}
