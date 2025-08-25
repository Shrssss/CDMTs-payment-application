package com.example.demo.entity;

import java.util.ArrayList;
import java.util.List;

import com.example.demo.model.Order;

import lombok.Data;
@Data
public class UserTable { // <-DB用
	/** ユーザID */
	private Long userId;
	/** 注文情報 */
	private List<Order>orders=new ArrayList<>();
}
