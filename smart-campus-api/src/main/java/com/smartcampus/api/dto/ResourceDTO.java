package com.smartcampus.api.dto;

import com.smartcampus.api.model.ResourceStatus;
import com.smartcampus.api.model.ResourceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.util.ArrayList;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResourceDTO {
    private Long id;

    @NotBlank(message = "Name is required")
    private String name;

    @NotNull(message = "Resource type is required")
    private ResourceType type;

    private Integer capacity;

    private Long locationId;

    private String locationName;

    @NotNull(message = "Status is required")
    private ResourceStatus status;

    private String imageUrl;

    private List<Long> assetIds = new ArrayList<>();
    
    private List<Long> amenityIds = new ArrayList<>();

    private List<ResourceAvailabilityDTO> availabilities = new ArrayList<>();
}
