package com.eventtracker.exception;

public class DuplicatePlacementException extends RuntimeException {
    public DuplicatePlacementException(String message) {
        super(message);
    }
}
