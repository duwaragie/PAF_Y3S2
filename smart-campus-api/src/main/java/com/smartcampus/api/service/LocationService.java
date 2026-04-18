package com.smartcampus.api.service;

import com.smartcampus.api.dto.LocationDTO;
import com.smartcampus.api.model.Location;
import com.smartcampus.api.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LocationService {

    private final LocationRepository locationRepository;

    public List<LocationDTO> getAllLocations() {
        return locationRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private LocationDTO convertToDTO(Location location) {
        return LocationDTO.builder()
                .id(location.getId())
                .block(location.getBlock())
                .floor(location.getFloor())
                .roomNumber(location.getRoomNumber())
                .roomType(location.getRoomType())
                .displayName(location.getDisplayName())
                .build();
    }
}
