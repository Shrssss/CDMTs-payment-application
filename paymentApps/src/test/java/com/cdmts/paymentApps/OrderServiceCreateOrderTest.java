package com.cdmts.paymentApps;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.cdmts.paymentApps.mapper.OrderItemMapper;
import com.cdmts.paymentApps.mapper.OrderMapper;
import com.cdmts.paymentApps.model.dto.OrderCreateRequest;
import com.cdmts.paymentApps.model.dto.OrderItemCreateRequest;
import com.cdmts.paymentApps.model.entity.Order;
import com.cdmts.paymentApps.model.entity.OrderItem;
import com.cdmts.paymentApps.service.DrinkAllocator;
import com.cdmts.paymentApps.service.OrderService;

@ExtendWith(MockitoExtension.class)
class OrderServiceCreateOrderTest {

	@Mock
	private OrderMapper orderMapper;

	@Mock
	private OrderItemMapper orderItemMapper;

	private OrderService orderService;

	@BeforeEach
	void setUp() {
		orderService = new OrderService(orderMapper, orderItemMapper, new DrinkAllocator());
	}

	private static OrderItemCreateRequest item(long itemId, int quantity) {
		OrderItemCreateRequest request = new OrderItemCreateRequest();
		ReflectionTestUtils.setField(request, "itemId", itemId);
		ReflectionTestUtils.setField(request, "quantity", quantity);
		return request;
	}

	private static OrderCreateRequest request(List<OrderItemCreateRequest> items, Map<Long, Integer> drinkCounts) {
		OrderCreateRequest request = new OrderCreateRequest();
		ReflectionTestUtils.setField(request, "orderDate", LocalDateTime.of(2026, 10, 17, 11, 0));
		ReflectionTestUtils.setField(request, "reservedTime", LocalDateTime.of(2026, 10, 17, 12, 10));
		ReflectionTestUtils.setField(request, "servingStatus", (short) 0);
		ReflectionTestUtils.setField(request, "paymentStatus", false);
		ReflectionTestUtils.setField(request, "items", items);
		ReflectionTestUtils.setField(request, "drinkCounts", drinkCounts);
		return request;
	}

	@Test
	@SuppressWarnings("unchecked")
	void ドリンクの内訳商品として明細を保存する() {
		when(orderMapper.insertOrder(any(Order.class))).thenAnswer(invocation -> {
			invocation.<Order>getArgument(0).setOrderId(7L);
			return 1;
		});
		when(orderItemMapper.insertOrderItems(anyList())).thenAnswer(invocation -> invocation.<List<?>>getArgument(0).size());

		Long orderId = orderService.createOrder(
				request(List.of(item(30, 1), item(40, 1)), Map.of(91L, 1, 92L, 1)));

		assertEquals(7L, orderId);
		ArgumentCaptor<List<OrderItem>> captor = ArgumentCaptor.forClass(List.class);
		verify(orderItemMapper).insertOrderItems(captor.capture());
		List<OrderItem> saved = captor.getValue();
		// セットにコーラ(41)、余ったオレンジは単品ドリンク(32)
		assertEquals(List.of(41L, 32L), saved.stream().map(OrderItem::getItemId).toList());
		assertEquals(List.of(1, 1), saved.stream().map(OrderItem::getQuantity).toList());
		assertEquals(List.of(7L, 7L), saved.stream().map(OrderItem::getOrderId).toList());
	}

	@Test
	void 割り振れない注文は注文自体を保存しない() {
		assertThrows(ResponseStatusException.class, () -> orderService.createOrder(
				request(List.of(item(40, 2)), Map.of(91L, 1))));

		verifyNoInteractions(orderMapper, orderItemMapper);
	}
}
