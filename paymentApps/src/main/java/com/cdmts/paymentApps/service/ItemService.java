package com.cdmts.paymentApps.service;

import java.util.ArrayList;
import java.util.List;

import org.apache.ibatis.annotations.Param;
import org.springframework.stereotype.Service;

import com.cdmts.paymentApps.mapper.ItemMapper;
import com.cdmts.paymentApps.model.entity.Item;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ItemService {
	
	private final ItemMapper itemMapper;

	public Item selectItemByItemId(@Param("itemId") int itemId){
		return mapper.selectItemByItemId(itemId);
	}
	
    public List<Item> selectAllItems(){
    	return mapper.selectAllItems();
    }
    
    /** Itemの在庫情報を更新し、Itemを返す　*/
    public List<Item> toggleAvailablity(int itemId,boolean available) {
    	
    	List<Item> items=new ArrayList<>();
    	
    	if(itemId%10==0) {
    		
    		int[] itemIds= {itemId,itemId+31,itemId+32,itemId+33,itemId+34};
    		int updated=0;
    				
    		for(int i=0;i<5;i++) {
    			
    			updated+=updateItemAvailabilityByItemId(itemIds[i],available);
    			
    			if(updated==0) {
           		 throw new IllegalArgumentException("指定されたitemIdが存在しません: "+itemIds[i]);
    			}
            	
            	items.add(selectItemByItemId(itemId));
    			
    		}

    	}else {
    		
    		int[] itemIds={itemId,90+itemId%10};
    		
    		int updated=0;
    		
    		for(int i=0;i<2;i++) {
    			updated+=updateItemAvailabilityByItemId(itemIds[i],available);
    			
    			if(updated==0) {
           		 throw new IllegalArgumentException("指定されたitemIdが存在しません: "+itemIds[i]);
    			}
    			
    			items.add(selectItemByItemId(itemIds[i]));
    			
    		}
    	}
    	
    	return items;
    	
    }
    
}
