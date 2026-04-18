package com.smartcampus.api.service.notification;

import com.smartcampus.api.model.NotificationChannelType;
import com.smartcampus.api.model.PushSubscription;
import com.smartcampus.api.repository.PushSubscriptionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import nl.martijndwars.webpush.Notification;
import nl.martijndwars.webpush.PushService;
import nl.martijndwars.webpush.Subscription;
import org.apache.http.HttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Delivers Web Push notifications to every subscription the user has registered.
 * Expired / invalid subscriptions (HTTP 404 or 410) are cleaned up automatically.
 *
 * The payload is a minimal JSON blob the service worker reads to build the
 * visible notification on the client.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PushNotificationChannel implements NotificationChannel {

    private final PushService pushService;
    private final PushSubscriptionRepository subscriptionRepository;

    @Override
    public NotificationChannelType type() {
        return NotificationChannelType.PUSH;
    }

    @Override
    @Transactional
    public void send(NotificationRequest request) {
        List<PushSubscription> subs = subscriptionRepository
                .findByUserId(request.getRecipient().getId());
        if (subs.isEmpty()) return;

        String payload = buildPayload(request);

        for (PushSubscription sub : subs) {
            try {
                Subscription apiSub = new Subscription(
                        sub.getEndpoint(),
                        new Subscription.Keys(sub.getP256dh(), sub.getAuth()));
                Notification notification = new Notification(apiSub, payload);
                HttpResponse response = pushService.send(notification);
                int code = response.getStatusLine().getStatusCode();
                if (code == 404 || code == 410) {
                    log.info("Push endpoint expired (HTTP {}); removing subscription {}",
                            code, sub.getId());
                    subscriptionRepository.deleteByEndpoint(sub.getEndpoint());
                } else if (code >= 400) {
                    log.warn("Push send returned HTTP {} for subscription {}", code, sub.getId());
                }
            } catch (Exception e) {
                log.warn("Push send failed for subscription {}: {}", sub.getId(), e.getMessage());
            }
        }
    }

    /** Minimal JSON so the service worker can render a {@code showNotification()}. */
    private String buildPayload(NotificationRequest r) {
        return "{"
                + "\"title\":" + jsonString(r.getTitle()) + ","
                + "\"message\":" + jsonString(r.getMessage()) + ","
                + "\"link\":" + jsonString(r.getLink() != null ? r.getLink() : "") + ","
                + "\"priority\":\"" + r.getPriority().name() + "\""
                + "}";
    }

    private String jsonString(String s) {
        if (s == null) return "\"\"";
        StringBuilder sb = new StringBuilder("\"");
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < 0x20) sb.append(String.format("\\u%04x", (int) c));
                    else sb.append(c);
                }
            }
        }
        return sb.append('"').toString();
    }
}
