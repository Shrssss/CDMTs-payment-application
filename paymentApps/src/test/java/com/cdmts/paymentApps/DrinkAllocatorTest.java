package com.cdmts.paymentApps;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import com.cdmts.paymentApps.model.dto.OrderItemCreateRequest;
import com.cdmts.paymentApps.service.DrinkAllocator;

class DrinkAllocatorTest {

	private final DrinkAllocator allocator = new DrinkAllocator();

	private static OrderItemCreateRequest item(long itemId, int quantity) {
		OrderItemCreateRequest request = new OrderItemCreateRequest();
		ReflectionTestUtils.setField(request, "itemId", itemId);
		ReflectionTestUtils.setField(request, "quantity", quantity);
		return request;
	}

	private static Map<Long, Integer> drinks(Object... pairs) {
		Map<Long, Integer> map = new LinkedHashMap<>();
		for (int i = 0; i < pairs.length; i += 2) {
			map.put(((Number) pairs[i]).longValue(), (Integer) pairs[i + 1]);
		}
		return map;
	}

	@Test
	void セットを優先し余りを単品ドリンクに割り振る() {
		// セット2・単品ドリンク1、コーラ2・オレンジ1
		Map<Long, Integer> result = allocator.allocate(
				List.of(item(40, 2), item(30, 1)), drinks(91, 2, 92, 1));

		assertEquals(Map.of(41L, 2, 32L, 1), result);
	}

	@Test
	void セットが埋まると大盛りセットへ溢れ最後に単品へ入る() {
		// セット1・大盛りセット1・単品ドリンク1、コーラ2・サイダー1
		Map<Long, Integer> result = allocator.allocate(
				List.of(item(40, 1), item(50, 1), item(30, 1)), drinks(91, 2, 93, 1));

		assertEquals(Map.of(41L, 1, 51L, 1, 33L, 1), result);
	}

	@Test
	void ドリンクの付かない商品はそのまま残る() {
		Map<Long, Integer> result = allocator.allocate(
				List.of(item(10, 2), item(20, 1), item(40, 1)), drinks(94, 1));

		assertEquals(Map.of(10L, 2, 20L, 1, 44L, 1), result);
	}

	@Test
	void ドリンク無しの注文はdrinkCountsが空でもよい() {
		assertEquals(Map.of(10L, 1), allocator.allocate(List.of(item(10, 1)), new HashMap<>()));
		assertEquals(Map.of(10L, 1), allocator.allocate(List.of(item(10, 1)), null));
	}

	@Test
	void 同じ商品が複数行で来たら合算する() {
		Map<Long, Integer> result = allocator.allocate(
				List.of(item(40, 1), item(40, 1)), drinks(91, 1, 92, 1));

		assertEquals(Map.of(41L, 1, 42L, 1), result);
	}

	@Test
	void ドリンクの本数がドリンク付き商品の数と合わなければ400() {
		assertBadRequest(() -> allocator.allocate(List.of(item(40, 2)), drinks(91, 1)));
		// drinkCounts を送り忘れた場合も、ドリンクの種類が分からない注文は受け付けない
		assertBadRequest(() -> allocator.allocate(List.of(item(30, 1)), new HashMap<>()));
		assertBadRequest(() -> allocator.allocate(List.of(item(10, 1)), drinks(91, 1)));
	}

	@Test
	void 不正な商品番号やドリンク番号や個数は400() {
		assertBadRequest(() -> allocator.allocate(List.of(item(41, 1)), drinks(91, 1)));
		assertBadRequest(() -> allocator.allocate(List.of(item(40, 1)), drinks(95, 1)));
		assertBadRequest(() -> allocator.allocate(List.of(item(40, 0)), drinks()));
		assertBadRequest(() -> allocator.allocate(List.of(item(40, 1)), drinks(91, -1, 92, 2)));
		assertBadRequest(() -> allocator.allocate(List.of(), drinks()));
		assertBadRequest(() -> allocator.allocate(null, drinks()));
	}

	private static void assertBadRequest(Runnable call) {
		ResponseStatusException ex = assertThrows(ResponseStatusException.class, call::run);
		assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
	}
}
