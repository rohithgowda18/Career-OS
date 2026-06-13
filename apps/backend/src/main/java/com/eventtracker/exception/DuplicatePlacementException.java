package com.eventtracker.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicatePlacementException extends RuntimeException {
    public DuplicatePlacementException(String message) {
        super(message);
    }
}
