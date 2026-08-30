package com.eventtracker.client;

import com.eventtracker.exception.AiServiceException;
import feign.Response;
import feign.codec.ErrorDecoder;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.io.IOUtils;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;

@Slf4j
public class AiServiceErrorDecoder implements ErrorDecoder {

    private final ErrorDecoder defaultErrorDecoder = new Default();

    @Override
    public Exception decode(String methodKey, Response response) {
        String responseBody = "";
        try {
            if (response.body() != null) {
                try (InputStream is = response.body().asInputStream()) {
                    responseBody = IOUtils.toString(is, StandardCharsets.UTF_8);
                }
            }
        } catch (Exception e) {
            log.error("Failed to read error response body from AI service", e);
        }

        log.error("AI service error on method {}: Status {}, Body: {}", methodKey, response.status(), responseBody);

        String message = String.format("AI Extraction Service returned error (%d): %s", response.status(), 
                responseBody.isBlank() ? response.reason() : responseBody);

        if (response.status() >= 400 && response.status() < 500) {
            return new AiServiceException(message, response.status());
        } else if (response.status() >= 500) {
            return new AiServiceException(message, response.status());
        }

        return defaultErrorDecoder.decode(methodKey, response);
    }
}
