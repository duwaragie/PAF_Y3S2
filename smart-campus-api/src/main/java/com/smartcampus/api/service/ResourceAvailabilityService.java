package com.smartcampus.api.service;

import com.smartcampus.api.dto.ResourceAvailabilityDTO;
import com.smartcampus.api.exception.ResourceNotFoundException;
import com.smartcampus.api.model.Resource;
import com.smartcampus.api.model.ResourceAvailability;
import com.smartcampus.api.repository.ResourceAvailabilityRepository;
import com.smartcampus.api.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ResourceAvailabilityService {

    private final ResourceAvailabilityRepository availabilityRepository;
    private final ResourceRepository resourceRepository;

    @Transactional(readOnly = true)
    public List<ResourceAvailabilityDTO> getAvailabilitiesByResourceId(Long resourceId) {
        if (!resourceRepository.existsById(resourceId)) {
            throw new ResourceNotFoundException("Resource not found with id: " + resourceId);
        }
        return availabilityRepository.findByResourceId(resourceId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<ResourceAvailabilityDTO> updateAvailabilities(Long resourceId, List<ResourceAvailabilityDTO> dtos) {
        Resource resource = resourceRepository.findById(resourceId)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + resourceId));

        availabilityRepository.deleteByResourceId(resourceId);

        List<ResourceAvailability> availabilities = dtos.stream().map(dto -> 
            ResourceAvailability.builder()
                .resource(resource)
                .dayOfWeek(dto.getDayOfWeek())
                .startTime(dto.getStartTime())
                .endTime(dto.getEndTime())
                .build()
        ).collect(Collectors.toList());

        return availabilityRepository.saveAll(availabilities).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private ResourceAvailabilityDTO convertToDTO(ResourceAvailability availability) {
        return new ResourceAvailabilityDTO(
                availability.getId(),
                availability.getResource().getId(),
                availability.getDayOfWeek(),
                availability.getStartTime(),
                availability.getEndTime()
        );
    }
}
