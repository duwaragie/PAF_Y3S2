package com.smartcampus.api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Payload the browser sends after {@code PushManager.subscribe()} succeeds.
 * Mirrors the JS {@code PushSubscriptionJSON.keys} shape.
 */
@Data
public class PushSubscriptionRequest {

    @NotBlank
    private String endpoint;

    @NotBlank
    private String p256dh;

    @NotBlank
    private String auth;

    private String userAgent;
}
