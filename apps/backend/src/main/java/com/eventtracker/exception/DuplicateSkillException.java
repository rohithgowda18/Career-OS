package com.eventtracker.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateSkillException extends RuntimeException {
    public DuplicateSkillException(String message) {
        super(message);
    }
}
