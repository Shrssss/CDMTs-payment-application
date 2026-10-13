package com.cdmts.paymentApps;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.cdmts.paymentApps.controller.PaymentController;
import com.cdmts.paymentApps.mapper.PaymentMapper;
import com.cdmts.paymentApps.model.entity.Order;
import com.cdmts.paymentApps.service.NotificationService;
import com.cdmts.paymentApps.service.PaymentService;

class PaymentNotificationTest {
    private PaymentMapper mapper;
    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        mapper = mock(PaymentMapper.class);
        PaymentService payments = new PaymentService(null, null, null, null, mapper);
        mvc = MockMvcBuilders.standaloneSetup(
                new PaymentController(payments, new NotificationService(mapper))).build();
    }

    private Order order(boolean paid) {
        Order order = new Order();
        order.setOrderId(123L);
        order.setPaymentId("O3f");
        order.setPaymentStatus(paid);
        return order;
    }

    @ParameterizedTest
    @ValueSource(strings = {"card", "paypay"})
    void formNotificationSavesBeforeAcknowledging(String method) throws Exception {
        when(mapper.selectOrderBySid("O3f")).thenReturn(order(false));
        when(mapper.markPaidBySid("O3f")).thenReturn(1);
        mvc.perform(post("/api/payments/paysys/" + method + "/notify")
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .param("SID", "O3f").param("KINGAKU", "1100")
                .param("CVS", method.equals("paypay") ? "paypay" : "VISA")
                .param("SEQ", "123456"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(MediaType.TEXT_PLAIN))
                .andExpect(content().bytes(new byte[] {'0', '\r', '\n'}));
        var sequence = inOrder(mapper);
        sequence.verify(mapper).selectOrderBySid("O3f");
        sequence.verify(mapper).markPaidBySid("O3f");
    }

    @Test
    void repeatedNotificationAcknowledgesWithoutUpdatingAgain() throws Exception {
        when(mapper.selectOrderBySid("O3f")).thenReturn(order(true));
        mvc.perform(post("/api/payments/paysys/card/notify").param("SID", "O3f"))
                .andExpect(status().isOk()).andExpect(content().string("0\r\n"));
        verify(mapper, never()).markPaidBySid(anyString());
    }

    @Test
    void missingSidRejectsBeforeDatabaseAccess() throws Exception {
        mvc.perform(post("/api/payments/paysys/card/notify"))
                .andExpect(status().isBadRequest());
        verifyNoInteractions(mapper);
    }

    @Test
    void unknownSidDoesNotAcknowledge() throws Exception {
        mvc.perform(post("/api/payments/paysys/card/notify").param("SID", "unknown"))
                .andExpect(status().isNotFound()).andExpect(content().string(""));
        verify(mapper, never()).markPaidBySid(anyString());
    }

    @Test
    void unsuccessfulUpdateDoesNotAcknowledge() throws Exception {
        when(mapper.selectOrderBySid("O3f")).thenReturn(order(false));
        mvc.perform(post("/api/payments/paysys/card/notify").param("SID", "O3f"))
                .andExpect(status().isServiceUnavailable()).andExpect(content().string(""));
    }

    @Test
    void databaseFailureDoesNotAcknowledge() throws Exception {
        when(mapper.selectOrderBySid("O3f")).thenReturn(order(false));
        when(mapper.markPaidBySid("O3f"))
                .thenThrow(new DataAccessResourceFailureException("test failure"));
        mvc.perform(post("/api/payments/paysys/paypay/notify").param("SID", "O3f"))
                .andExpect(status().isServiceUnavailable()).andExpect(content().string(""));
    }

    @Test
    void getNotificationIsNotAccepted() throws Exception {
        mvc.perform(get("/api/payments/paysys/card/notify").param("SID", "O3f"))
                .andExpect(status().isMethodNotAllowed());
        verifyNoInteractions(mapper);
    }

    @Test
    void statusDistinguishesWaitingPaidAndMissingOrder() throws Exception {
        when(mapper.selectPaymentStatusByOrderId(123L)).thenReturn(false, true, null);
        mvc.perform(get("/api/payments/123/status"))
                .andExpect(status().isOk()).andExpect(header().string("Cache-Control", "no-store"))
                .andExpect(jsonPath("$.orderId").value(123))
                .andExpect(jsonPath("$.state").value("WAITING"));
        mvc.perform(get("/api/payments/123/status"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.state").value("PAID"));
        mvc.perform(get("/api/payments/123/status"))
                .andExpect(status().isNotFound());
        verify(mapper, never()).markPaidBySid(anyString());
    }

    @Test
    void nonPositiveOrderIdIsRejected() throws Exception {
        mvc.perform(get("/api/payments/0/status")).andExpect(status().isBadRequest());
        verifyNoInteractions(mapper);
    }
}
