package com.smartcampus.api.service.ai;

public class ToolUseFailedException extends RuntimeException {
    public ToolUseFailedException(String body) {
        super(body);
    }
}
