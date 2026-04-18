package com.smartcampus.api.service.notification;

import com.smartcampus.api.event.BookingEvents;
import com.smartcampus.api.model.Booking;
import com.smartcampus.api.model.NotificationPriority;
import com.smartcampus.api.model.NotificationType;
import com.smartcampus.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

/**
 * Subscribes to domain events from other modules (booking today; ticket, etc.
 * later) and converts them to notification requests. This is the only file
 * that has to change when a new event type starts producing notifications.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventListener {

    private final NotificationDispatcher dispatcher;
    private final UserRepository userRepository;

    @EventListener
    public void onBookingCreated(BookingEvents.BookingCreated event) {
        Booking b = event.booking();
        dispatcher.dispatch(NotificationRequest.builder()
                .recipient(b.getUser())
                .type(NotificationType.BOOKING_CREATED)
                .priority(NotificationPriority.MEDIUM)
                .title("Booking request submitted")
                .message(String.format(
                        "Your booking for %s from %s to %s is awaiting admin approval.",
                        b.getResource().getName(), b.getStartTime(), b.getEndTime()))
                .link("/bookings")
                .build());

        // Let admins know so they can review promptly.
        userRepository.findByRole(com.smartcampus.api.model.Role.ADMIN)
                .forEach(admin -> dispatcher.dispatch(NotificationRequest.builder()
                        .recipient(admin)
                        .type(NotificationType.BOOKING_CREATED)
                        .priority(NotificationPriority.LOW)
                        .title("New booking request")
                        .message(String.format(
                                "%s requested %s (%s – %s).",
                                b.getUser().getName(), b.getResource().getName(),
                                b.getStartTime(), b.getEndTime()))
                        .link("/admin/bookings")
                        .build()));
    }

    @EventListener
    public void onBookingApproved(BookingEvents.BookingApproved event) {
        Booking b = event.booking();
        dispatcher.dispatch(NotificationRequest.builder()
                .recipient(b.getUser())
                .type(NotificationType.BOOKING_APPROVED)
                .priority(NotificationPriority.HIGH)
                .title("Booking approved")
                .message(String.format(
                        "Your booking for %s (%s – %s) has been approved.",
                        b.getResource().getName(), b.getStartTime(), b.getEndTime()))
                .link("/bookings")
                .build());
    }

    @EventListener
    public void onBookingRejected(BookingEvents.BookingRejected event) {
        Booking b = event.booking();
        String reason = event.reason() != null ? " Reason: " + event.reason() : "";
        dispatcher.dispatch(NotificationRequest.builder()
                .recipient(b.getUser())
                .type(NotificationType.BOOKING_REJECTED)
                .priority(NotificationPriority.HIGH)
                .title("Booking rejected")
                .message(String.format(
                        "Your booking for %s (%s – %s) was rejected.%s",
                        b.getResource().getName(), b.getStartTime(), b.getEndTime(), reason))
                .link("/bookings")
                .build());
    }

    @EventListener
    public void onBookingCancelled(BookingEvents.BookingCancelled event) {
        Booking b = event.booking();
        boolean cancelledByAdmin = event.actorId() != null
                && !event.actorId().equals(b.getUser().getId());
        if (!cancelledByAdmin) return; // user cancelling their own booking doesn't need a self-notification

        dispatcher.dispatch(NotificationRequest.builder()
                .recipient(b.getUser())
                .type(NotificationType.BOOKING_CANCELLED)
                .priority(NotificationPriority.MEDIUM)
                .title("Booking cancelled")
                .message(String.format(
                        "An administrator cancelled your booking for %s (%s – %s).",
                        b.getResource().getName(), b.getStartTime(), b.getEndTime()))
                .link("/bookings")
                .build());
    }
}
