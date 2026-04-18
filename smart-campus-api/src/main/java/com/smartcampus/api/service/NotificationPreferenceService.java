package com.smartcampus.api.service;

import com.smartcampus.api.dto.NotificationPreferenceDTO;
import com.smartcampus.api.exception.ResourceNotFoundException;
import com.smartcampus.api.model.User;
import com.smartcampus.api.model.UserNotificationPreference;
import com.smartcampus.api.repository.UserNotificationPreferenceRepository;
import com.smartcampus.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationPreferenceService {

    private static final boolean DEFAULT_EMAIL = true;
    private static final boolean DEFAULT_PUSH = false;

    private final UserNotificationPreferenceRepository preferenceRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public NotificationPreferenceDTO getForUser(Long userId) {
        return preferenceRepository.findByUserId(userId)
                .map(p -> NotificationPreferenceDTO.builder()
                        .email(p.getEmail())
                        .push(p.getPush())
                        .build())
                .orElseGet(() -> NotificationPreferenceDTO.builder()
                        .email(DEFAULT_EMAIL)
                        .push(DEFAULT_PUSH)
                        .build());
    }

    @Transactional
    public NotificationPreferenceDTO update(Long userId, NotificationPreferenceDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        UserNotificationPreference pref = preferenceRepository.findByUserId(userId)
                .orElseGet(() -> UserNotificationPreference.builder()
                        .user(user)
                        .email(DEFAULT_EMAIL)
                        .push(DEFAULT_PUSH)
                        .build());

        if (dto.getEmail() != null) pref.setEmail(dto.getEmail());
        if (dto.getPush() != null) pref.setPush(dto.getPush());

        pref = preferenceRepository.save(pref);
        return NotificationPreferenceDTO.builder()
                .email(pref.getEmail())
                .push(pref.getPush())
                .build();
    }
}
