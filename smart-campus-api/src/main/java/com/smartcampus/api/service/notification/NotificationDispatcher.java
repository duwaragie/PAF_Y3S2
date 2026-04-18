package com.smartcampus.api.service.notification;

import com.smartcampus.api.model.NotificationChannelType;
import com.smartcampus.api.model.UserNotificationPreference;
import com.smartcampus.api.repository.UserNotificationPreferenceRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Central fan-out. In-app always fires (the user can't disable it — it's the
 * safety net so no notification is ever silently dropped). Email and push
 * fire only if the user's preference row allows it (default: email ON, push OFF).
 *
 * Adding a new channel = implementing {@link NotificationChannel}; Spring
 * auto-registers it here via the injected list.
 */
@Slf4j
@Component
public class NotificationDispatcher {

    private static final boolean DEFAULT_EMAIL = true;
    private static final boolean DEFAULT_PUSH = false;

    private final Map<NotificationChannelType, NotificationChannel> channels =
            new EnumMap<>(NotificationChannelType.class);

    private final UserNotificationPreferenceRepository preferenceRepository;

    public NotificationDispatcher(List<NotificationChannel> channelBeans,
                                  UserNotificationPreferenceRepository preferenceRepository) {
        for (NotificationChannel c : channelBeans) channels.put(c.type(), c);
        this.preferenceRepository = preferenceRepository;
    }

    public void dispatch(NotificationRequest request) {
        Long userId = request.getRecipient().getId();

        // In-app is the baseline channel — always on.
        send(NotificationChannelType.IN_APP, request);

        UserNotificationPreference pref = preferenceRepository.findByUserId(userId).orElse(null);
        boolean emailOn = pref != null ? Boolean.TRUE.equals(pref.getEmail()) : DEFAULT_EMAIL;
        boolean pushOn = pref != null ? Boolean.TRUE.equals(pref.getPush()) : DEFAULT_PUSH;

        if (emailOn) send(NotificationChannelType.EMAIL, request);
        if (pushOn) send(NotificationChannelType.PUSH, request);
    }

    private void send(NotificationChannelType ct, NotificationRequest request) {
        NotificationChannel channel = channels.get(ct);
        if (channel != null) channel.send(request);
    }
}
