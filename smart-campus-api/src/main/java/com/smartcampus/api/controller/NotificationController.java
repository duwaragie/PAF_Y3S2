package com.smartcampus.api.controller;

import com.smartcampus.api.dto.NotificationDTO;
import com.smartcampus.api.model.User;
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
}
