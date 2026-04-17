package com.smartcampus.api.service;

import com.smartcampus.api.dto.AmenityDTO;
import com.smartcampus.api.exception.ResourceNotFoundException;
import com.smartcampus.api.model.Amenity;
import com.smartcampus.api.repository.AmenityRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AmenityService {

    private final AmenityRepository amenityRepository;

    public List<AmenityDTO> getAll() {
        return amenityRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public AmenityDTO create(AmenityDTO dto) {
        Amenity amenity = new Amenity();
        amenity.setName(dto.getName());
        amenity.setDescription(dto.getDescription());
        return convertToDTO(amenityRepository.save(amenity));
    }

    public AmenityDTO update(Long id, AmenityDTO dto) {
        Amenity amenity = amenityRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Amenity not found with id: " + id));
        amenity.setName(dto.getName());
        amenity.setDescription(dto.getDescription());
        return convertToDTO(amenityRepository.save(amenity));
    }

    public void delete(Long id) {
        if (!amenityRepository.existsById(id)) {
            throw new ResourceNotFoundException("Amenity not found with id: " + id);
        }
        amenityRepository.deleteById(id);
    }

    private AmenityDTO convertToDTO(Amenity amenity) {
        return new AmenityDTO(amenity.getId(), amenity.getName(), amenity.getDescription());
    }
}
