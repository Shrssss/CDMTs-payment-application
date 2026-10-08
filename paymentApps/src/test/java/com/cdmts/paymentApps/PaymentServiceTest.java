package com.cdmts.paymentApps;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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

    //  注文の合計金額を計算するテスト
    @Test
    void preparePaymentReturnsCalculatedAmount() {
        Long orderId = 123L;
        String sid = "TEST000000000001";

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

        OrderPaymentResponse response =
                paymentService.preparePayment(orderId, sid);

        assertEquals(orderId, response.getOrderId());
        assertEquals(sid, response.getSid());
        assertEquals(Long.valueOf(1100L), response.getAmount());
        assertEquals("1100", response.getFields().get("K1"));
        assertEquals(
                "https://www.paydesign.jp/settle/settle3/bp3.dll",
                response.getAction());

        verifyNoInteractions(squareClient, paymentMapper);
    }

    // 条件超過の確認テスト
    @Test
    void InvalidAmountThrowsException() {
        Long orderId = 123L;
        String sid = "TEST000000000001";

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
            paymentService.preparePayment(orderId, sid);
            verifyNoInteractions(squareClient, paymentMapper);
        });
    }
}
