package com.example.demo.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.example.demo.model.OrderItem;

import lombok.Data;
@Data
public class OrderTable { // <-DB用
	/** 注文番号 */
	private Long orderId;
	/** 注文日時 */
	private LocalDateTime orderDate;
	/** 受け渡しの有無 */
	private Boolean servingStatus;
	/** ユーザID */
	private Long userId;
	/** 注文商品 */
	private List<OrderItem>items=new ArrayList<>();
}
