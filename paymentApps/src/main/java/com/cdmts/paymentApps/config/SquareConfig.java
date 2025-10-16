package com.cdmts.paymentApps.config;

import org.springframework.context.annotation.*;

import com.squareup.square.SquareClient;
import com.squareup.square.core.Environment;

@Configuration
public class SquareConfig {
	@Bean
    /** クライアントを作成 */
	SquareClient squareClient() {
		SquareClient client=SquareClient.builder()
				.environment(Environment.PRODUCTION) //Environment.PRODUCTION //<-本番
				.token(System.getenv("SQUARE_TOKEN")).build();
		return client;
	}

}
