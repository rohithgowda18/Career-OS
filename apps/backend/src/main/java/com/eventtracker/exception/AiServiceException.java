package com.eventtracker.exception;

public class AiServiceException extends RuntimeException {
    private final int statusCode;

    public AiServiceException(String message) {
        super(message);
        this.statusCode = 500;
    }

    public AiServiceException(String message, int statusCode) {
        super(message);
        this.statusCode = statusCode;
    }

    public AiServiceException(String message, Throwable cause) {
        super(message, cause);
        this.statusCode = 500;
    }

    public AiServiceException(String message, int statusCode, Throwable cause) {
        super(message, cause);
        this.statusCode = statusCode;
    }

    public int getStatusCode() {
        return statusCode;
    }
}
