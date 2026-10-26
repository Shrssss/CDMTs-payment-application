package com.cdmts.paymentApps;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.anyString;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;
import java.time.LocalDateTime;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import com.cdmts.paymentApps.mapper.ItemMapper;
import com.cdmts.paymentApps.mapper.OrderItemMapper;
import com.cdmts.paymentApps.mapper.OrderMapper;
import com.cdmts.paymentApps.mapper.PaymentMapper;
import com.cdmts.paymentApps.model.dto.OrderPaymentResponse;
import com.cdmts.paymentApps.model.entity.Item;
import com.cdmts.paymentApps.model.entity.Order;
import com.cdmts.paymentApps.model.entity.OrderItem;
import com.cdmts.paymentApps.service.PaymentService;
import com.squareup.square.SquareClient;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTest {

    @Mock
    private SquareClient squareClient;

    @Mock
    private OrderMapper orderMapper;

    @Mock
    private OrderItemMapper orderItemMapper;

    @Mock
    private ItemMapper itemMapper;

    @Mock
    private PaymentMapper paymentMapper;

    @InjectMocks
    private PaymentService paymentService;

    @Test
    void returnSidRestoresPaidOrderWithoutBrowserStorage() {
        String sid = "0123456789abcdef";
        Order order = new Order();
        order.setOrderId(42L);
        order.setPaymentStatus(true);
        order.setOrderDate(LocalDateTime.of(2026, 10, 17, 10, 0));
        order.setReservedTime(LocalDateTime.of(2026, 10, 17, 10, 30));
        OrderItem item = new OrderItem();
        item.setItemId(10L);
        item.setQuantity(2);
        when(paymentMapper.selectOrderBySid(sid)).thenReturn(order);
        when(orderItemMapper.selectOrderItemsByOrderId(42L)).thenReturn(List.of(item));

        var result = paymentService.getPaymentReturnOrder(sid);
        assertEquals(42L, result.orderId());
        assertEquals("PAID", result.state());
        assertEquals(Integer.valueOf(2), result.cart().get(10L));
        verifyNoInteractions(squareClient);
    }

    //  注文の合計金額を計算するテスト
    @Test
    void preparePaymentReturnsCalculatedAmount() {
        Long orderId = 123L;

        ReflectionTestUtils.setField(paymentService, "paymentActionUrl", "https://www.testpayment.com/settle");

        Order order = new Order();
        order.setOrderId(orderId);
        order.setPaymentStatus(false);

        OrderItem firstOrderItem = new OrderItem();
        firstOrderItem.setOrderId(orderId);
        firstOrderItem.setItemId(10L);
        firstOrderItem.setQuantity(2);

        OrderItem secondOrderItem = new OrderItem();
        secondOrderItem.setOrderId(orderId);
        secondOrderItem.setItemId(20L);
        secondOrderItem.setQuantity(1);

        Item firstItem = new Item();
        firstItem.setItemId(10L);
        firstItem.setPrice(300);

        Item secondItem = new Item();
        secondItem.setItemId(20L);
        secondItem.setPrice(500);

        when(orderMapper.selectOrdersByOrderIds(List.of(orderId)))
                .thenReturn(List.of(order));

        when(orderItemMapper.selectOrderItemsByOrderId(orderId))
                .thenReturn(List.of(firstOrderItem, secondOrderItem));

        when(itemMapper.selectItemsByItemIds(List.of(10L, 20L)))
                .thenReturn(List.of(firstItem, secondItem));

        when(paymentMapper.updateSidByOrderId(org.mockito.ArgumentMatchers.eq(orderId), anyString())).thenReturn(1);

        OrderPaymentResponse response =
                paymentService.preparePayment(orderId);

        assertEquals(orderId, response.getOrderId());
        assertTrue(response.getSid().matches("[0-9a-f]{16}"));
        assertEquals(Long.valueOf(1100L), response.getAmount());
        assertEquals("1100", response.getFields().get("K1"));
        assertEquals(
                "https://www.testpayment.com/settle",
                response.getAction());

        verify(paymentMapper).updateSidByOrderId(orderId, response.getSid());
        verifyNoInteractions(squareClient);
    }

    // 条件超過の確認テスト
    @Test
    void InvalidAmountThrowsException() {
        Long orderId = 123L;

        Order order = new Order();
        order.setOrderId(orderId);
        order.setPaymentStatus(false);

        OrderItem firstOrderItem = new OrderItem();
        firstOrderItem.setOrderId(orderId);
        firstOrderItem.setItemId(10L);
        firstOrderItem.setQuantity(1);

        OrderItem secondOrderItem = new OrderItem();
        secondOrderItem.setOrderId(orderId);
        secondOrderItem.setItemId(20L);
        secondOrderItem.setQuantity(1);

        Item firstItem = new Item();
        firstItem.setItemId(10L);
        firstItem.setPrice(9_999_500);

        Item secondItem = new Item();
        secondItem.setItemId(20L);
        secondItem.setPrice(500);

        when(orderMapper.selectOrdersByOrderIds(List.of(orderId)))
                .thenReturn(List.of(order));

        when(orderItemMapper.selectOrderItemsByOrderId(orderId))
                .thenReturn(List.of(firstOrderItem, secondOrderItem));

        when(itemMapper.selectItemsByItemIds(List.of(10L, 20L)))
                .thenReturn(List.of(firstItem, secondItem));

        assertThrows(IllegalArgumentException.class, () -> {
            paymentService.preparePayment(orderId);
        });
        verifyNoInteractions(squareClient, paymentMapper);
    }

    // SID保存で注文を更新できなければ、開始情報を返さない
    @Test
    void preparePaymentThrowsWhenSidCannotBeSaved() {
        Long orderId = 123L;

        Order order = new Order();
        order.setOrderId(orderId);
        order.setPaymentStatus(false);

        OrderItem orderItem = new OrderItem();
        orderItem.setOrderId(orderId);
        orderItem.setItemId(10L);
        orderItem.setQuantity(2);

        Item item = new Item();
        item.setItemId(10L);
        item.setPrice(300);

        when(orderMapper.selectOrdersByOrderIds(List.of(orderId)))
                .thenReturn(List.of(order));
        when(orderItemMapper.selectOrderItemsByOrderId(orderId))
                .thenReturn(List.of(orderItem));
        when(itemMapper.selectItemsByItemIds(List.of(10L)))
                .thenReturn(List.of(item));
        when(paymentMapper.updateSidByOrderId(org.mockito.ArgumentMatchers.eq(orderId), anyString())).thenReturn(0);

        assertThrows(IllegalStateException.class,
                () -> paymentService.preparePayment(orderId));

        verify(paymentMapper).updateSidByOrderId(org.mockito.ArgumentMatchers.eq(orderId), anyString());
        verifyNoInteractions(squareClient);
    }
}
