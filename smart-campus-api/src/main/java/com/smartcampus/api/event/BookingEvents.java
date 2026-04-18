package com.smartcampus.api.event;

import com.smartcampus.api.model.Booking;

/**
 * Domain events fired by BookingService. The notification module listens
 * to these — BookingService itself has no direct dependency on notifications.
 *
 * Same pattern will apply to the ticket module when it lands: publish an
 * event, don't call the notification service directly.
 */
public final class BookingEvents {

    private BookingEvents() {}

    public record BookingCreated(Booking booking) {}
    public record BookingApproved(Booking booking, Long adminId) {}
    public record BookingRejected(Booking booking, Long adminId, String reason) {}
    public record BookingCancelled(Booking booking, Long actorId) {}
}
