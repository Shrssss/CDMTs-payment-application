package com.cdmts.paymentApps.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;

import com.cdmts.paymentApps.model.entity.Item;

@Mapper
public interface ItemMapper {

	/** アイテムIDで商品を取得 */
	public Item selectItemByItemId(Integer itemId);
	/** すべての商品を取得 */
	public List<Item> selectAllItems();
	
	/** 商品を登録（事前登録） */
	public int insertItem(Item item);
	
	/** 在庫情報を更新 */
	public int updateItemAvailabilityByItemId(Integer itemId,Boolean available);
	
}
