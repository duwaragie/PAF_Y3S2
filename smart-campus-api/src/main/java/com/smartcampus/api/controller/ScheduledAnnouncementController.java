package com.smartcampus.api.controller;

import com.smartcampus.api.dto.CreateScheduledAnnouncementRequest;
import com.smartcampus.api.dto.ScheduledAnnouncementDTO;
import com.smartcampus.api.model.User;
import com.smartcampus.api.service.ScheduledAnnouncementService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/announcements")
@RequiredArgsConstructor
public class ScheduledAnnouncementController {

    private final ScheduledAnnouncementService service;

    @PostMapping
    public ResponseEntity<ScheduledAnnouncementDTO> create(
            Authentication authentication,
            @Valid @RequestBody CreateScheduledAnnouncementRequest req) {
        User admin = (User) authentication.getPrincipal();
        return ResponseEntity.ok(service.create(admin, req));
    }

    @GetMapping
    public ResponseEntity<List<ScheduledAnnouncementDTO>> listAll() {
        return ResponseEntity.ok(service.listAll());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> cancel(@PathVariable Long id) {
        service.cancel(id);
        return ResponseEntity.noContent().build();
    }
}
