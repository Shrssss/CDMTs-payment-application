package com.example.demo.model;

import lombok.Data;
import lombok.EqualsAndHashCode; // <-lombokでgetter,setterを生成
import java.util.List;
import java.util.ArrayList;
@Data
@EqualsAndHashCode(callSuper=true)
public class User extends CommonData{ //テーブルは外部キーとしてorderIdを持つ
	/** ユーザID */
	private Long userId;
	/** 注文情報 */
	private List<Order>orders=new ArrayList<>();
}
