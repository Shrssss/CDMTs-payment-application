package com.CDMTs.paymentApp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.mybatis.spring.annotation.MapperScan;

@SpringBootApplication
@MapperScan("com.CDMTs.paymentApp.entity.mapper")
public class DemoApplication {	//起動前処理

	public static void main(String[] args) {
		SpringApplication.run(DemoApplication.class, args);
	}

}
