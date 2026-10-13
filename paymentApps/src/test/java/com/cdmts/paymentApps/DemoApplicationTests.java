package com.cdmts.paymentApps;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import static org.junit.jupiter.api.Assertions.assertEquals;

// 外部決済・実DBへ接続せず、実際の組込みHTTPサーバーと全Beanの起動を検証する。
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT, properties = {
    "paysys.action-url=https://example.invalid/pay",
    "paysys.card-ip=local-card", "paysys.paypay-ip=local-paypay",
    "spring.datasource.url=jdbc:mysql://127.0.0.1:1/local_startup_only",
    "spring.datasource.username=unused", "spring.datasource.password=unused",
    "logging.level.root=WARN", "debug=false"
})
class DemoApplicationTests {
    @Autowired private TestRestTemplate http;

	@Test
	void contextLoads() {
		assertEquals(HttpStatus.BAD_REQUEST,
            http.getForEntity("/api/payments/0/status", String.class).getStatusCode());
	}

}
