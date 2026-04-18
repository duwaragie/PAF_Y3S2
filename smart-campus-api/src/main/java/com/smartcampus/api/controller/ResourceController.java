package com.smartcampus.api.controller;

import com.smartcampus.api.dto.ResourceDTO;
import com.smartcampus.api.model.ResourceStatus;
import com.smartcampus.api.model.ResourceType;
import com.smartcampus.api.service.ResourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/resources")
@RequiredArgsConstructor
public class ResourceController {

    private final ResourceService resourceService;

    @GetMapping
    public ResponseEntity<List<ResourceDTO>> getAllResources() {
        return ResponseEntity.ok(resourceService.getAllResources());
    }

    @GetMapping("/search")
    public ResponseEntity<List<ResourceDTO>> searchResources(
            @RequestParam(required = false) ResourceType type,
            @RequestParam(required = false) ResourceStatus status,
            @RequestParam(required = false) Long locationId,
            @RequestParam(required = false) Integer minCapacity,
            @RequestParam(required = false) List<Long> assetIds,
            @RequestParam(required = false) List<Long> amenityIds) {
        return ResponseEntity.ok(resourceService.searchResources(type, status, locationId, minCapacity, assetIds, amenityIds));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ResourceDTO> getResourceById(@PathVariable Long id) {
        return ResponseEntity.ok(resourceService.getResourceById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceDTO> createResource(@Valid @RequestBody ResourceDTO resourceDTO) {
        return ResponseEntity.status(HttpStatus.CREATED).body(resourceService.createResource(resourceDTO));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ResourceDTO> updateResource(@PathVariable Long id, @Valid @RequestBody ResourceDTO resourceDTO) {
        return ResponseEntity.ok(resourceService.updateResource(id, resourceDTO));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteResource(@PathVariable Long id) {
        resourceService.deleteResource(id);
        return ResponseEntity.noContent().build();
    }
}
