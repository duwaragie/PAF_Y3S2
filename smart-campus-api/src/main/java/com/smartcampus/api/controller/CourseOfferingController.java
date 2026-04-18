package com.smartcampus.api.controller;

import com.smartcampus.api.dto.CourseOfferingDTO;
import com.smartcampus.api.dto.CreateCourseOfferingRequest;
import com.smartcampus.api.model.CourseOfferingStatus;
import com.smartcampus.api.model.User;
import com.smartcampus.api.service.CourseOfferingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/course-offerings")
@RequiredArgsConstructor
public class CourseOfferingController {

    private final CourseOfferingService courseOfferingService;

    // GET /api/course-offerings?semester=2026-Y3S2&status=OPEN
    @GetMapping
    public ResponseEntity<List<CourseOfferingDTO>> list(
            @RequestParam(required = false) String semester,
            @RequestParam(required = false) CourseOfferingStatus status) {
        return ResponseEntity.ok(courseOfferingService.list(semester, status));
    }

    // GET /api/course-offerings/mine (lecturer's offerings)
    @GetMapping("/mine")
    @PreAuthorize("hasRole('LECTURER')")
    public ResponseEntity<List<CourseOfferingDTO>> mine(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(courseOfferingService.listByLecturer(user.getId()));
    }

    // GET /api/course-offerings/{id}
    @GetMapping("/{id}")
    public ResponseEntity<CourseOfferingDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(courseOfferingService.getById(id));
    }

    // POST /api/course-offerings
    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CourseOfferingDTO> create(@Valid @RequestBody CreateCourseOfferingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(courseOfferingService.create(request));
    }

    // PUT /api/course-offerings/{id}
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CourseOfferingDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody CreateCourseOfferingRequest request) {
        return ResponseEntity.ok(courseOfferingService.update(id, request));
    }

    // PATCH /api/course-offerings/{id}/status?status=OPEN
    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CourseOfferingDTO> updateStatus(
            @PathVariable Long id,
            @RequestParam CourseOfferingStatus status) {
        return ResponseEntity.ok(courseOfferingService.updateStatus(id, status));
    }

    // DELETE /api/course-offerings/{id}
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        courseOfferingService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
