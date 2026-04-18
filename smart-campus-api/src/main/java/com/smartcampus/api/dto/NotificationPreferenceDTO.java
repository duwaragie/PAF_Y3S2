package com.smartcampus.api.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Global channel preferences. In-app is always on (not user-toggleable),
 * so it's not represented here. Only email and push are opt-in/out.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationPreferenceDTO {
    private Boolean email;
    private Boolean push;
}
