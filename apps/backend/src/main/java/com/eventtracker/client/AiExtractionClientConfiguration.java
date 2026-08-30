package com.eventtracker.client;

import feign.Logger;
import feign.RequestInterceptor;
import feign.codec.ErrorDecoder;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;

public class AiExtractionClientConfiguration {

    @Value("${app.ai-extraction-service.internal-key:${AI_SERVICE_INTERNAL_KEY:${INTERNAL_SERVICE_KEY:career-os-internal-ai-secret}}}")
    private String internalApiKey;

    @Bean
    public RequestInterceptor requestInterceptor() {
        return requestTemplate -> {
            if (internalApiKey != null && !internalApiKey.isBlank()) {
                requestTemplate.header("X-Internal-Service-Key", internalApiKey);
            }
        };
    }

    @Bean
    public ErrorDecoder errorDecoder() {
        return new AiServiceErrorDecoder();
    }

    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.BASIC;
    }
}
