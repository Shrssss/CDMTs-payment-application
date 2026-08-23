package com.cdmts.paymentApps.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.cdmts.paymentApps.mapper.ItemMapper;
import com.cdmts.paymentApps.model.dto.ItemCreateRequest;
import com.cdmts.paymentApps.model.dto.ItemResponse;
import com.cdmts.paymentApps.model.entity.Item;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ItemService {
	
	private final ItemMapper itemMapper;
	
	public ItemResponse toResponse(Item itemEntity) {
		
		return new ItemResponse(
					itemEntity.getItemId(),
					itemEntity.getItemName(),
					itemEntity.getPrice(),
					itemEntity.getAvailable()
				);
		
	}

	public List<ItemResponse> getItemsByItemIds(List<Long> itemIds){
		
		List<Item>itemEntities=itemMapper.selectItemsByItemIds(itemIds);
		
		return itemEntities.stream()
				.map(item->toResponse(item))
				.toList();
	
	}
	
    public List<ItemResponse> selectAllItems(){
    	
    	List<Item>itemEntities=itemMapper.selectAllItems();
    	
    	return itemEntities.stream()
				.map(item->toResponse(item))
				.toList();
    	
    }
    
    @Transactional
    public List<Long> updateAvailablity(List<Long> itemIds,Boolean available) {
    	
    	int updateCount=itemMapper.updateItemAvailabilityByItemId(itemIds,available);
    	
    	if(updateCount!=itemIds.size()) throw new IllegalArgumentException("Expected same update row between requested ids but was "+updateCount+".");
    	
    	return itemIds;
    	
    }
    
    @Transactional
    public List<Long> createItems(List<ItemCreateRequest> itemDtos){
    	
    	List<Item>itemEntities=itemDtos.stream()
    							.map(dto->dto.toEntity())
    							.toList();
    	
    	int insertCount=itemMapper.insertItems(itemEntities);
    	
    	if(insertCount!=itemDtos.size())throw new IllegalArgumentException("Expected same insert row between requested items but was "+insertCount+".");
    	
    	return itemEntities.stream()
    			.map(item->item.getItemId())
    			.toList();
    	
    }
    
}
