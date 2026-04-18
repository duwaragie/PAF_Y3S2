package com.smartcampus.api.controller;

import com.smartcampus.api.dto.ResourceAvailabilityDTO;
import com.smartcampus.api.service.ResourceAvailabilityService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources/{resourceId}/availability")
@RequiredArgsConstructor
public class ResourceAvailabilityController {

    private final ResourceAvailabilityService availabilityService;

    @GetMapping
    public ResponseEntity<List<ResourceAvailabilityDTO>> getAvailabilities(@PathVariable Long resourceId) {
        return ResponseEntity.ok(availabilityService.getAvailabilitiesByResourceId(resourceId));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ResourceAvailabilityDTO>> updateAvailabilities(
            @PathVariable Long resourceId, 
            @RequestBody List<ResourceAvailabilityDTO> dtos) {
        return ResponseEntity.ok(availabilityService.updateAvailabilities(resourceId, dtos));
    }
}
