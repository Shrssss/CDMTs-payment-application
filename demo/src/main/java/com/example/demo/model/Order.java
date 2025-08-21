package com.example.demo.model;

import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;
import java.util.ArrayList;
@Data
public class Order {
	/** 注文番号 */
	private Long orderId;
	/** 注文日時 */
	private LocalDateTime orderDate;
	/** 決済方法 */
	private String paymentMethod;
	/** 決済の有無 */
	private Boolean paymentStatus;
	/** 注文商品 */
	private List<OrderItem>items=new ArrayList<>();
}
