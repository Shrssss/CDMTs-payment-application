package com.cdmts.paymentApps;

import static org.junit.jupiter.api.Assertions.*;

import java.time.LocalDateTime;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.mybatis.spring.boot.test.autoconfigure.MybatisTest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;

import com.cdmts.paymentApps.mapper.OrderMapper;
import com.cdmts.paymentApps.mapper.PaymentMapper;
import com.cdmts.paymentApps.model.entity.Order;

/** dev_dbへの明示的な実行時だけ有効。各テストの変更は自動rollbackされる。 */
@MybatisTest
@ActiveProfiles("mapper-integration")
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@EnabledIfEnvironmentVariable(named = "RUN_DB_INTEGRATION_TESTS", matches = "true")
class PaymentMapperIntegrationTest {
    @Autowired private PaymentMapper paymentMapper;
    @Autowired private OrderMapper orderMapper;
    @Autowired private JdbcTemplate jdbc;

    @BeforeEach
    void checkDatabaseBeforeWriting() {
        assertEquals("dev_db", jdbc.queryForObject("SELECT DATABASE()", String.class),
                "結合テストはdev_dbでのみ実行できます");
        assertEquals("InnoDB", jdbc.queryForObject(
                "SELECT ENGINE FROM information_schema.TABLES "
                + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'ORDER_TABLE'", String.class),
                "rollback可能なInnoDBが必要です");
    }

    @Test
    void savesSidAndFindsOrderWithoutChangingOtherFields() {
        Order original = new Order();
        original.setOrderDate(LocalDateTime.of(2026, 10, 11, 10, 0));
        original.setReservedTime(LocalDateTime.of(2026, 10, 11, 10, 30));
        original.setServingStatus((short) 0);
        original.setPaymentStatus(false);
        original.setIdempotencyKey(UUID.randomUUID().toString());
        orderMapper.insertOrder(original);
        assertNotNull(original.getOrderId());

        String sid = "O" + Long.toString(original.getOrderId(), 36);
        assertNull(paymentMapper.selectOrderBySid(sid), "テスト用SIDが既に登録されています");
        assertEquals(1, paymentMapper.updateSidByOrderId(original.getOrderId(), sid));

        Order found = paymentMapper.selectOrderBySid(sid);
        assertNotNull(found);
        assertEquals(original.getOrderId(), found.getOrderId());
        assertEquals(sid, found.getPaymentId());
        assertEquals(original.getOrderDate(), found.getOrderDate());
        assertEquals(original.getReservedTime(), found.getReservedTime());
        assertEquals(original.getServingStatus(), found.getServingStatus());
        assertEquals(original.getPaymentStatus(), found.getPaymentStatus());
        assertEquals(original.getIdempotencyKey(), found.getIdempotencyKey());

        // Serviceが再準備を保存成功と判断できる戻り値か確認する。
        assertEquals(1, paymentMapper.updateSidByOrderId(original.getOrderId(), sid),
                "同一SIDの再保存が0件なら、Serviceの更新件数判定を見直してください");

        assertEquals(1, paymentMapper.markPaidBySid(sid));
        Order paid = paymentMapper.selectOrderBySid(sid);
        assertTrue(paid.getPaymentStatus());
        assertTrue(paymentMapper.selectPaymentStatusByOrderId(original.getOrderId()));
        assertEquals(sid, paid.getPaymentId());
        assertEquals(original.getIdempotencyKey(), paid.getIdempotencyKey());
        assertEquals(original.getServingStatus(), paid.getServingStatus());
    }

    @Test
    void unknownSidReturnsNull() {
        String sid = UUID.randomUUID().toString().replace("-", "").substring(0, 16);
        assertEquals(0, jdbc.queryForObject(
                "SELECT COUNT(*) FROM ORDER_TABLE WHERE PAYMENTID = ?", Integer.class, sid));
        assertNull(paymentMapper.selectOrderBySid(sid));
        assertEquals(0, paymentMapper.markPaidBySid(sid));
    }
}
