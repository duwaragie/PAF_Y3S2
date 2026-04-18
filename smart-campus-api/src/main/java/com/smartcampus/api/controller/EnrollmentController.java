package com.smartcampus.api.controller;

import com.smartcampus.api.dto.EnrollRequest;
import com.smartcampus.api.dto.EnrollmentDTO;
import com.smartcampus.api.dto.SetGradeRequest;
import com.smartcampus.api.dto.TranscriptDTO;
import com.smartcampus.api.model.User;
import com.smartcampus.api.service.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class EnrollmentController {

    private final EnrollmentService enrollmentService;

    // POST /api/enrollments  { "sectionId": N }
    @PostMapping("/api/enrollments")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<EnrollmentDTO> enroll(
            Authentication authentication,
            @Valid @RequestBody EnrollRequest request) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(enrollmentService.enroll(user.getId(), request.getSectionId()));
    }

    // DELETE /api/enrollments/{id}
    @DeleteMapping("/api/enrollments/{id}")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<EnrollmentDTO> withdraw(
            Authentication authentication,
            @PathVariable Long id) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(enrollmentService.withdraw(user.getId(), id));
    }

    // GET /api/enrollments/me
    @GetMapping("/api/enrollments/me")
    public ResponseEntity<List<EnrollmentDTO>> listMine(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(enrollmentService.listMine(user.getId()));
    }

    // GET /api/enrollments/section/{sectionId}  (LECTURER/ADMIN)
    @GetMapping("/api/enrollments/section/{sectionId}")
    @PreAuthorize("hasRole('LECTURER')")
    public ResponseEntity<List<EnrollmentDTO>> roster(@PathVariable Long sectionId) {
        return ResponseEntity.ok(enrollmentService.listBySection(sectionId));
    }

    // PUT /api/enrollments/{id}/grade  (LECTURER on same offering / ADMIN)
    @PutMapping("/api/enrollments/{id}/grade")
    @PreAuthorize("hasRole('LECTURER')")
    public ResponseEntity<EnrollmentDTO> setGrade(
            Authentication authentication,
            @PathVariable Long id,
            @Valid @RequestBody SetGradeRequest request) {
        User actor = (User) authentication.getPrincipal();
        return ResponseEntity.ok(enrollmentService.setGrade(id, request.getGrade(), actor));
    }

    // POST /api/course-offerings/{offeringId}/release-grades  (LECTURER on offering / ADMIN)
    @PostMapping("/api/course-offerings/{offeringId}/release-grades")
    @PreAuthorize("hasRole('LECTURER')")
    public ResponseEntity<Map<String, Integer>> releaseGrades(
            Authentication authentication,
            @PathVariable Long offeringId) {
        User actor = (User) authentication.getPrincipal();
        int released = enrollmentService.releaseGradesForOffering(offeringId, actor);
        return ResponseEntity.ok(Map.of("released", released));
    }

    // GET /api/transcripts/me
    @GetMapping("/api/transcripts/me")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<TranscriptDTO> myTranscript(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(enrollmentService.transcript(user.getId()));
    }
}
