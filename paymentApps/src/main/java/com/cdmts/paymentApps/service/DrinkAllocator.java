package com.cdmts.paymentApps.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.cdmts.paymentApps.model.dto.OrderItemCreateRequest;

/*
 * 注文の商品カテゴリ(items)とドリンク種別ごとの本数(drinkCounts)から、
 * 保存する明細の商品番号を組み立てる。
 *
 * ドリンクを伴う商品(30/40/50)は「カテゴリ番号 + ドリンク番号の下1桁」の内訳商品として保存する。
 *   例) 角煮ドリンクセット(40) + コーラ(91) → 41
 * 内訳商品(31〜34/41〜44/51〜54)は商品マスタに登録しておく必要がある
 * (db/migration/2026-10-add-drink-breakdown-items.sql)。
 *
 * 割り振りはドリンク番号の小さい順(コーラ→オレンジ→サイダー→烏龍茶)に、
 * セット(40) → 大盛りセット(50) → 単品ドリンク(30) の空きへ先着で詰める。
 * どのセットにどのドリンクを付けるかは客に選ばせていないため、本数が合えばよい。
 */
@Component
public class DrinkAllocator {

	public static final long PORK_SINGLE = 10;
	public static final long PORK_SINGLE_LARGE = 20;
	public static final long DRINK_SINGLE = 30;
	public static final long PORK_DRINK_SET = 40;
	public static final long PORK_DRINK_SET_LARGE = 50;

	/* ドリンク種別。下1桁が内訳商品の下1桁になる */
	public static final List<Long> DRINK_IDS = List.of(91L, 92L, 93L, 94L);

	/* 客用フロントが注文できる商品カテゴリ */
	private static final Set<Long> ORDERABLE_ITEM_IDS =
			Set.of(PORK_SINGLE, PORK_SINGLE_LARGE, DRINK_SINGLE, PORK_DRINK_SET, PORK_DRINK_SET_LARGE);

	/* ドリンクの割り当て先。この順に空きを埋める */
	private static final List<Long> DRINK_LINKED_ITEM_IDS =
			List.of(PORK_DRINK_SET, PORK_DRINK_SET_LARGE, DRINK_SINGLE);

	/**
	 * 保存する明細を「商品番号 → 個数」で返す(並びは決まった順)。
	 * 入力が不正なら 400 を投げる。注文を保存する前に呼ぶこと。
	 */
	public Map<Long, Integer> allocate(List<OrderItemCreateRequest> items, Map<Long, Integer> drinkCounts) {

		Map<Long, Integer> categoryCounts = sumCategories(items);
		Map<Long, Integer> drinks = sumDrinks(drinkCounts);

		int drinkSlots = DRINK_LINKED_ITEM_IDS.stream().mapToInt(id -> categoryCounts.getOrDefault(id, 0)).sum();
		int drinkTotal = drinks.values().stream().mapToInt(Integer::intValue).sum();

		if (drinkSlots != drinkTotal) {
			throw badRequest("ドリンクの本数(" + drinkTotal + ")がドリンク付き商品の数(" + drinkSlots + ")と一致しません");
		}

		Map<Long, Integer> result = new LinkedHashMap<>();

		for (Long itemId : List.of(PORK_SINGLE, PORK_SINGLE_LARGE)) {
			int quantity = categoryCounts.getOrDefault(itemId, 0);
			if (quantity > 0) result.put(itemId, quantity);
		}

		Map<Long, Integer> remainingSlots = new LinkedHashMap<>();
		for (Long itemId : DRINK_LINKED_ITEM_IDS) {
			remainingSlots.put(itemId, categoryCounts.getOrDefault(itemId, 0));
		}

		for (Long drinkId : DRINK_IDS) {
			int remaining = drinks.getOrDefault(drinkId, 0);

			for (Long itemId : DRINK_LINKED_ITEM_IDS) {
				if (remaining == 0) break;

				int take = Math.min(remaining, remainingSlots.get(itemId));
				if (take == 0) continue;

				result.merge(breakdownItemId(itemId, drinkId), take, Integer::sum);
				remainingSlots.put(itemId, remainingSlots.get(itemId) - take);
				remaining -= take;
			}
		}

		return result;
	}

	/** カテゴリ(30/40/50)とドリンク(91〜94)から内訳商品の番号を作る。例) 40 + 91 → 41 */
	public static long breakdownItemId(long categoryId, long drinkId) {
		return categoryId + drinkId % 10;
	}

	private Map<Long, Integer> sumCategories(List<OrderItemCreateRequest> items) {

		if (items == null || items.isEmpty()) {
			throw badRequest("注文商品がありません");
		}

		Map<Long, Integer> counts = new LinkedHashMap<>();

		for (OrderItemCreateRequest item : items) {
			if (item == null || item.getItemId() == null || !ORDERABLE_ITEM_IDS.contains(item.getItemId())) {
				throw badRequest("注文できない商品です: " + (item == null ? null : item.getItemId()));
			}
			if (item.getQuantity() == null || item.getQuantity() <= 0) {
				throw badRequest("個数が不正です: " + item.getItemId());
			}
			counts.merge(item.getItemId(), item.getQuantity(), Integer::sum);
		}

		return counts;
	}

	private Map<Long, Integer> sumDrinks(Map<Long, Integer> drinkCounts) {

		Map<Long, Integer> counts = new LinkedHashMap<>();

		if (drinkCounts == null) return counts;

		for (Map.Entry<Long, Integer> entry : drinkCounts.entrySet()) {
			if (entry.getKey() == null || !DRINK_IDS.contains(entry.getKey())) {
				throw badRequest("ドリンクの種類が不正です: " + entry.getKey());
			}
			if (entry.getValue() == null || entry.getValue() < 0) {
				throw badRequest("ドリンクの本数が不正です: " + entry.getKey());
			}
			if (entry.getValue() > 0) counts.merge(entry.getKey(), entry.getValue(), Integer::sum);
		}

		return counts;
	}

	private ResponseStatusException badRequest(String message) {
		return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
	}
}
