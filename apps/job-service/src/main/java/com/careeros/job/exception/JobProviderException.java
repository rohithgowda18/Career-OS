package com.careeros.job.exception;

import lombok.Getter;

@Getter
public class JobProviderException extends RuntimeException {
    private final int statusCode;
    private final String errorCode;

    public JobProviderException(String message, int statusCode, String errorCode) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
    }

    public JobProviderException(String message, int statusCode, String errorCode, Throwable cause) {
        super(message, cause);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
    }
}
