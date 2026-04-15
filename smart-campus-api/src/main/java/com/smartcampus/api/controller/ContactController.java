package com.smartcampus.api.controller;

import com.smartcampus.api.dto.ContactMessageRequest;
import com.smartcampus.api.service.EmailService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/contact")
@RequiredArgsConstructor
public class ContactController {

    private final EmailService emailService;

    @Value("${app.seed.admin-email}")
    private String inboxEmail;

    @PostMapping
    public ResponseEntity<Map<String, String>> submit(@Valid @RequestBody ContactMessageRequest request) {
        emailService.sendContactEmail(
                inboxEmail,
                request.getEmail(),
                request.getName(),
                request.getSubject(),
                request.getMessage()
        );
        return ResponseEntity.ok(Map.of("message", "Thanks for reaching out. We'll be in touch."));
    }
}
