package com.smartcampus.api.controller;

import com.smartcampus.api.dto.LecturerDashboardSummary;
import com.smartcampus.api.dto.StudentDashboardSummary;
import com.smartcampus.api.model.User;
import com.smartcampus.api.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/student/summary")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<StudentDashboardSummary> studentSummary(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(dashboardService.studentSummary(user.getId()));
    }

    @GetMapping("/lecturer/summary")
    @PreAuthorize("hasRole('LECTURER')")
    public ResponseEntity<LecturerDashboardSummary> lecturerSummary(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(dashboardService.lecturerSummary(user.getId()));
    }
}
