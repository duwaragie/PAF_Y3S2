package com.smartcampus.api.controller;

import com.smartcampus.api.config.VapidConfig;
import com.smartcampus.api.dto.PushSubscriptionRequest;
import com.smartcampus.api.model.User;
import com.smartcampus.api.service.PushSubscriptionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/push")
@RequiredArgsConstructor
public class PushSubscriptionController {

    private final PushSubscriptionService service;
    private final VapidConfig vapidConfig;

    // GET /api/push/vapid-public-key — browser needs this to call PushManager.subscribe()
    @GetMapping("/vapid-public-key")
    public ResponseEntity<Map<String, String>> vapidPublicKey() {
        return ResponseEntity.ok(Map.of("publicKey", vapidConfig.getPublicKey()));
    }

    // POST /api/push/subscribe — browser has granted permission and created a subscription
    @PostMapping("/subscribe")
    public ResponseEntity<Void> subscribe(
            Authentication authentication,
            @Valid @RequestBody PushSubscriptionRequest request) {
        User user = (User) authentication.getPrincipal();
        service.subscribe(user.getId(), request);
        return ResponseEntity.noContent().build();
    }

    // DELETE /api/push/subscribe — user disabled push or cleared browser data
    @DeleteMapping("/subscribe")
    public ResponseEntity<Void> unsubscribe(@RequestParam String endpoint) {
        service.unsubscribe(endpoint);
        return ResponseEntity.noContent().build();
    }
}
