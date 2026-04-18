package com.smartcampus.api.service;

import com.smartcampus.api.dto.ResourceDTO;
import com.smartcampus.api.exception.ResourceNotFoundException;
import com.smartcampus.api.model.Resource;
import com.smartcampus.api.model.ResourceStatus;
import com.smartcampus.api.model.ResourceType;
import com.smartcampus.api.model.Asset;
import com.smartcampus.api.model.Amenity;
import com.smartcampus.api.model.Location;
import com.smartcampus.api.repository.ResourceRepository;
import com.smartcampus.api.repository.AssetRepository;
import com.smartcampus.api.repository.AmenityRepository;
import com.smartcampus.api.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
@Transactional
public class ResourceService {

    private final ResourceRepository resourceRepository;
    private final AssetRepository assetRepository;
    private final AmenityRepository amenityRepository;
    private final LocationRepository locationRepository;

    @Transactional(readOnly = true)
    public List<ResourceDTO> getAllResources() {
        return resourceRepository.findAll().stream().map(this::convertToDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<ResourceDTO> searchResources(ResourceType type, ResourceStatus status, Long locationId, Integer minCapacity, List<Long> assetIds, List<Long> amenityIds) {
        Long assetCount = (assetIds != null && !assetIds.isEmpty()) ? (long) assetIds.size() : null;
        Long amenityCount = (amenityIds != null && !amenityIds.isEmpty()) ? (long) amenityIds.size() : null;
        
        // Handle empty lists by setting them to null so the query condition is ignored
        List<Long> finalAssetIds = (assetIds != null && assetIds.isEmpty()) ? null : assetIds;
        List<Long> finalAmenityIds = (amenityIds != null && amenityIds.isEmpty()) ? null : amenityIds;
        
        return resourceRepository.searchResources(type, status, locationId, minCapacity, finalAssetIds, assetCount, finalAmenityIds, amenityCount)
                .stream().map(this::convertToDTO).toList();
    }

    @Transactional(readOnly = true)
    public ResourceDTO getResourceById(Long id) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));
        return convertToDTO(resource);
    }

    @Transactional
    public ResourceDTO createResource(ResourceDTO dto) {
        Resource resource = new Resource();
        resource.setName(dto.getName());
        resource.setType(dto.getType());
        resource.setCapacity(dto.getCapacity());
        resource.setAvailabilityWindows(dto.getAvailabilityWindows());
        resource.setStatus(dto.getStatus());
        resource.setImageUrl(dto.getImageUrl());
        
        if (dto.getLocationId() != null) {
            Location location = locationRepository.findById(dto.getLocationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + dto.getLocationId()));
            resource.setLocation(location);
        }
        
        mapIdsToEntities(dto, resource);
        
        return convertToDTO(resourceRepository.save(resource));
    }

    @Transactional
    public ResourceDTO updateResource(Long id, ResourceDTO dto) {
        Resource resource = resourceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + id));
        resource.setName(dto.getName());
        resource.setType(dto.getType());
        resource.setCapacity(dto.getCapacity());
        resource.setAvailabilityWindows(dto.getAvailabilityWindows());
        resource.setStatus(dto.getStatus());
        resource.setImageUrl(dto.getImageUrl());
        
        if (dto.getLocationId() != null) {
            Location location = locationRepository.findById(dto.getLocationId())
                    .orElseThrow(() -> new ResourceNotFoundException("Location not found with id: " + dto.getLocationId()));
            resource.setLocation(location);
        } else {
            resource.setLocation(null);
        }
        
        mapIdsToEntities(dto, resource);
        
        return convertToDTO(resourceRepository.save(resource));
    }

    @Transactional
    public void deleteResource(Long id) {
        if (!resourceRepository.existsById(id)) {
            throw new ResourceNotFoundException("Resource not found with id: " + id);
        }
        resourceRepository.deleteById(id);
    }

    private void mapIdsToEntities(ResourceDTO dto, Resource resource) {
        if (dto.getAssetIds() != null && !dto.getAssetIds().isEmpty()) {
            Set<Asset> assets = dto.getAssetIds().stream()
                    .map(assetId -> assetRepository.findById(assetId)
                            .orElseThrow(() -> new ResourceNotFoundException("Asset not found with id: " + assetId)))
                    .collect(Collectors.toSet());
            resource.setAssets(assets);
        } else {
            resource.getAssets().clear();
        }

        if (dto.getAmenityIds() != null && !dto.getAmenityIds().isEmpty()) {
            Set<Amenity> amenities = dto.getAmenityIds().stream()
                    .map(amenityId -> amenityRepository.findById(amenityId)
                            .orElseThrow(() -> new ResourceNotFoundException("Amenity not found with id: " + amenityId)))
                    .collect(Collectors.toSet());
            resource.setAmenities(amenities);
        } else {
            resource.getAmenities().clear();
        }
    }

    private ResourceDTO convertToDTO(Resource resource) {
        List<Long> assetIds = resource.getAssets() != null 
            ? resource.getAssets().stream().map(Asset::getId).toList() 
            : new ArrayList<>();
            
        List<Long> amenityIds = resource.getAmenities() != null 
            ? resource.getAmenities().stream().map(Amenity::getId).toList() 
            : new ArrayList<>();

        return new ResourceDTO(
                resource.getId(),
                resource.getName(),
                resource.getType(),
                resource.getCapacity(),
                resource.getLocation() != null ? resource.getLocation().getId() : null,
                resource.getLocation() != null ? resource.getLocation().getDisplayName() : null,
                resource.getAvailabilityWindows(),
                resource.getStatus(),
                resource.getImageUrl(),
                assetIds,
                amenityIds
        );
    }
}
