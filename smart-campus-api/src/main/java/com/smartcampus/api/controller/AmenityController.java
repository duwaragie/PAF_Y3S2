package com.smartcampus.api.controller;

import com.smartcampus.api.dto.AmenityDTO;
import com.smartcampus.api.service.AmenityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/amenities")
@RequiredArgsConstructor
public class AmenityController {

    private final AmenityService amenityService;

    @GetMapping
    public ResponseEntity<List<AmenityDTO>> getAll() {
        return ResponseEntity.ok(amenityService.getAll());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AmenityDTO> create(@Valid @RequestBody AmenityDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(amenityService.create(dto));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AmenityDTO> update(@PathVariable Long id, @Valid @RequestBody AmenityDTO dto) {
        return ResponseEntity.ok(amenityService.update(id, dto));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        amenityService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
