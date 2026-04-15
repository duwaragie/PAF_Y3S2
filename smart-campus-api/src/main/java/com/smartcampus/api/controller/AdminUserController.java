package com.smartcampus.api.controller;

import com.smartcampus.api.dto.CreateUserRequest;
import com.smartcampus.api.dto.UserDTO;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
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

    // POST /api/admin/users
    @PostMapping
    public ResponseEntity<UserDTO> createUser(@Valid @RequestBody CreateUserRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(userService.createUser(request));
    }

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

    // PATCH /api/admin/users/{id}/identifier
    @PatchMapping("/{id}/identifier")
    public ResponseEntity<UserDTO> assignIdentifier(
            @PathVariable Long id,
            @RequestParam(required = false) String studentRegistrationNumber,
            @RequestParam(required = false) String employeeId) {
        return ResponseEntity.ok(userService.assignIdentifier(id, studentRegistrationNumber, employeeId));
    }

    // DELETE /api/admin/users/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // POST /api/admin/users/bulk-delete  { "ids": [1,2,3] }
    @PostMapping("/bulk-delete")
    public ResponseEntity<java.util.Map<String, Integer>> bulkDelete(
            @RequestBody java.util.Map<String, java.util.List<Long>> body) {
        int deleted = userService.deleteUsers(body.getOrDefault("ids", java.util.List.of()));
        return ResponseEntity.ok(java.util.Map.of("deleted", deleted));
    }
}