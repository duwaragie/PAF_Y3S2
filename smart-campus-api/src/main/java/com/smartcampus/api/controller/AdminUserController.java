package com.smartcampus.api.controller;

import com.smartcampus.api.dto.UserDTO;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    // GET /api/admin/users
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    // GET /api/admin/users/{id}
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // PUT /api/admin/users/{id}/role?role=ADMIN
    @PutMapping("/{id}/role")
    public ResponseEntity<UserDTO> updateRole(
            @PathVariable Long id,
            @RequestParam Role role) {
        return ResponseEntity.ok(userService.updateRole(id, role));
    }

    // DELETE /api/admin/users/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }
}