package com.cdmts.paymentApps.service;

import java.util.Map;

import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.cdmts.paymentApps.mapper.PaymentMapper;
import com.cdmts.paymentApps.model.entity.Order;

import lombok.RequiredArgsConstructor;

/** 正常な決済通知の最小処理。通知元・金額等の照合はI07/I08で追加する。 */
@Service
@RequiredArgsConstructor
public class NotificationService {
    private final PaymentMapper paymentMapper;

    @Transactional
    public void handlePaymentNotification(Map<String, String> notification) {
        String sid = notification.get("SID");
        if (sid == null || sid.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "SIDが必要です");
        }

        try {
            Order order = paymentMapper.selectOrderBySid(sid);
            if (order == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "対応する注文がありません");
            }
            // 支払済みへの再送は正常完了。未払いに戻したり再課金したりしない。
            if (Boolean.TRUE.equals(order.getPaymentStatus())) {
                return;
            }
            if (paymentMapper.markPaidBySid(sid) != 1) {
                throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "決済状態を保存できませんでした");
            }
        } catch (DataAccessException ex) {
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE, "決済状態を保存できませんでした", ex);
        }
    }
}
