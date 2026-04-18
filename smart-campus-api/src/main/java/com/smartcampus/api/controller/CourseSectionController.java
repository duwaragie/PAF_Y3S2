package com.smartcampus.api.controller;

import com.smartcampus.api.dto.CourseSectionDTO;
import com.smartcampus.api.dto.CreateCourseSectionRequest;
import com.smartcampus.api.model.User;
import com.smartcampus.api.service.CourseSectionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class CourseSectionController {

    private final CourseSectionService courseSectionService;

    // GET /api/course-offerings/{offeringId}/sections
    @GetMapping("/api/course-offerings/{offeringId}/sections")
    public ResponseEntity<List<CourseSectionDTO>> listByOffering(@PathVariable Long offeringId) {
        return ResponseEntity.ok(courseSectionService.listByOffering(offeringId));
    }

    // POST /api/course-offerings/{offeringId}/sections
    @PostMapping("/api/course-offerings/{offeringId}/sections")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CourseSectionDTO> create(
            @PathVariable Long offeringId,
            @Valid @RequestBody CreateCourseSectionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(courseSectionService.create(offeringId, request));
    }

    // GET /api/course-sections/{id}
    @GetMapping("/api/course-sections/{id}")
    public ResponseEntity<CourseSectionDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(courseSectionService.getById(id));
    }

    // PUT /api/course-sections/{id}
    @PutMapping("/api/course-sections/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<CourseSectionDTO> update(
            @PathVariable Long id,
            @Valid @RequestBody CreateCourseSectionRequest request) {
        return ResponseEntity.ok(courseSectionService.update(id, request));
    }

    // DELETE /api/course-sections/{id}
    @DeleteMapping("/api/course-sections/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        courseSectionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // GET /api/course-sections/mine (lecturer's sections)
    @GetMapping("/api/course-sections/mine")
    @PreAuthorize("hasRole('LECTURER')")
    public ResponseEntity<List<CourseSectionDTO>> mine(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(courseSectionService.listByLecturer(user.getId()));
    }
}
