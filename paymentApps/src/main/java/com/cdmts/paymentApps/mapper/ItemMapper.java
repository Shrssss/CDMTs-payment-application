package com.cdmts.paymentApps.mapper;

import java.util.List;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import com.cdmts.paymentApps.model.entity.Item;

@Mapper
public interface ItemMapper {

	/** アイテムIDで商品を取得 */
	public List<Item> selectItemsByItemIds(@Param("itemIds")List<Long> itemIds);
	/** すべての商品を取得 */
	public List<Item> selectAllItems();
	
	/** 商品を登録（事前登録） */
	public int insertItems(@Param("items")List<Item> items);
	
	/** 在庫情報を更新 */
	public int updateItemAvailabilityByItemId(@Param("itemIds")List<Long> itemIds,@Param("available")Boolean available);
	
}
