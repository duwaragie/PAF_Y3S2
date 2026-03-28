package com.smartcampus.api.exception;

public class UserNotFoundException extends RuntimeException {
    public UserNotFoundException(String message) {
        super(message);
    }
    
    public UserNotFoundException(Long id) {
        super("User not found with id: " + id);
    }
    
    public UserNotFoundException(String field, String value) {
        super("User not found with " + field + ": " + value);
    }
}
