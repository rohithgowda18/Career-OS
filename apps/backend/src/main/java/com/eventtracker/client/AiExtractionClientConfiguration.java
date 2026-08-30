package com.eventtracker.client;

import feign.Logger;
import feign.codec.ErrorDecoder;
import org.springframework.context.annotation.Bean;

public class AiExtractionClientConfiguration {

    @Bean
    public ErrorDecoder errorDecoder() {
        return new AiServiceErrorDecoder();
    }

    @Bean
    public Logger.Level feignLoggerLevel() {
        return Logger.Level.BASIC;
    }
}
