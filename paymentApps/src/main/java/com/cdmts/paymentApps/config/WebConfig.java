package com.cdmts.paymentApps.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {
	private final String allowedOrigins = System.getenv("ALLOWED_ORIGINS");

	@Override
	public void addViewControllers(ViewControllerRegistry registry) {
		registry.addViewController("/{spring:\\\\w+}")
		.setViewName("forward:/index.html");
		
		registry.addViewController("/")
		.setViewName("forward:/index.html");
	}
	
		@Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
            .allowedOrigins(allowedOrigins)
            .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
            .allowCredentials(true);
	}
}
