package com.smartcampus.api.service;

import com.smartcampus.api.dto.AssetDTO;
import com.smartcampus.api.exception.ResourceNotFoundException;
import com.smartcampus.api.model.Asset;
import com.smartcampus.api.repository.AssetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AssetService {

    private final AssetRepository assetRepository;

    public List<AssetDTO> getAll() {
        return assetRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public AssetDTO create(AssetDTO dto) {
        Asset asset = new Asset();
        asset.setName(dto.getName());
        asset.setDescription(dto.getDescription());
        return convertToDTO(assetRepository.save(asset));
    }

    public AssetDTO update(Long id, AssetDTO dto) {
        Asset asset = assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found with id: " + id));
        asset.setName(dto.getName());
        asset.setDescription(dto.getDescription());
        return convertToDTO(assetRepository.save(asset));
    }

    public void delete(Long id) {
        if (!assetRepository.existsById(id)) {
            throw new ResourceNotFoundException("Asset not found with id: " + id);
        }
        assetRepository.deleteById(id);
    }

    private AssetDTO convertToDTO(Asset asset) {
        return new AssetDTO(asset.getId(), asset.getName(), asset.getDescription());
    }
}
