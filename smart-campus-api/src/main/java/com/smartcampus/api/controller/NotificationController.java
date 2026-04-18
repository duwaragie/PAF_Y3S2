package com.smartcampus.api.controller;

import com.smartcampus.api.dto.NotificationDTO;
import com.smartcampus.api.dto.NotificationPreferenceDTO;
import com.smartcampus.api.model.User;
import com.smartcampus.api.service.NotificationPreferenceService;
import com.smartcampus.api.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final NotificationPreferenceService preferenceService;

    // GET /api/notifications/me?limit=50
    @GetMapping("/me")
    public ResponseEntity<List<NotificationDTO>> listMine(
            Authentication authentication,
            @RequestParam(defaultValue = "50") int limit) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(notificationService.listForUser(user.getId(), limit));
    }

    // GET /api/notifications/me/unread-count
    @GetMapping("/me/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(Map.of("count", notificationService.unreadCount(user.getId())));
    }

    // PATCH /api/notifications/{id}/read
    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationDTO> markRead(
            Authentication authentication,
            @PathVariable Long id) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(notificationService.markRead(user.getId(), id));
    }

    // PATCH /api/notifications/me/read-all
    @PatchMapping("/me/read-all")
    public ResponseEntity<Map<String, Integer>> markAllRead(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        int updated = notificationService.markAllRead(user.getId());
        return ResponseEntity.ok(Map.of("updated", updated));
    }

    // DELETE /api/notifications/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            Authentication authentication,
            @PathVariable Long id) {
        User user = (User) authentication.getPrincipal();
        notificationService.delete(user.getId(), id);
        return ResponseEntity.noContent().build();
    }

    // GET /api/notifications/preferences — global channel toggles (email, push)
    @GetMapping("/preferences")
    public ResponseEntity<NotificationPreferenceDTO> getPreferences(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(preferenceService.getForUser(user.getId()));
    }

    // PUT /api/notifications/preferences — update email and/or push
    @PutMapping("/preferences")
    public ResponseEntity<NotificationPreferenceDTO> updatePreferences(
            Authentication authentication,
            @RequestBody NotificationPreferenceDTO request) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(preferenceService.update(user.getId(), request));
    }
}
