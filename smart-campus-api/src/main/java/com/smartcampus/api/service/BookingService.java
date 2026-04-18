package com.smartcampus.api.service;

import com.smartcampus.api.dto.BookingDTO;
import com.smartcampus.api.dto.CreateBookingRequest;
import com.smartcampus.api.dto.ApproveBookingRequest;
import com.smartcampus.api.dto.RejectBookingRequest;
import com.smartcampus.api.event.BookingEvents;
import com.smartcampus.api.exception.ResourceNotFoundException;
import com.smartcampus.api.exception.BadRequestException;
import com.smartcampus.api.model.*;
import com.smartcampus.api.repository.BookingRepository;
import com.smartcampus.api.repository.UserRepository;
import com.smartcampus.api.repository.ResourceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ResourceRepository resourceRepository;
    private final ApplicationEventPublisher eventPublisher;

    /**
     * Create a new booking request
     */
    public BookingDTO createBooking(Long userId, CreateBookingRequest request) {
        // Validate time range
        if (request.getStartTime().isAfter(request.getEndTime()) || 
            request.getStartTime().equals(request.getEndTime())) {
            throw new BadRequestException("End time must be after start time");
        }

        // Fetch user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        // Fetch resource
        Resource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + request.getResourceId()));

        // Validate expected attendees against resource capacity
        if (resource.getCapacity() != null
                && request.getExpectedAttendees() != null
                && request.getExpectedAttendees() > resource.getCapacity()) {
            throw new BadRequestException(
                    "\"" + resource.getName() + "\" has a capacity of " + resource.getCapacity()
                            + ", but you entered " + request.getExpectedAttendees()
                            + " expected attendees. Please reduce the count or pick a larger facility.");
        }

        // Check for scheduling conflicts (APPROVED bookings only — PENDING does not block)
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                request.getResourceId(),
                request.getStartTime(),
                request.getEndTime());

        if (!conflicts.isEmpty()) {
            throw new BadRequestException(
                    "Resource is not available during the requested time range. " +
                    "There are " + conflicts.size() + " conflicting booking(s)."
            );
        }

        // Create new booking
        Booking booking = Booking.builder()
                .user(user)
                .resource(resource)
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .purpose(request.getPurpose())
                .expectedAttendees(request.getExpectedAttendees())
                .status(BookingStatus.PENDING)
                .build();

        booking = bookingRepository.save(booking);
        eventPublisher.publishEvent(new BookingEvents.BookingCreated(booking));
        return convertToDTO(booking);
    }

    /**
     * Get booking by ID
     */
    @Transactional(readOnly = true)
    public BookingDTO getBookingById(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));
        return convertToDTO(booking);
    }

    /**
     * Get all bookings for a user
     */
    @Transactional(readOnly = true)
    public Page<BookingDTO> getUserBookings(Long userId, BookingStatus status, Pageable pageable) {
        Page<Booking> bookings;
        if (status != null) {
            bookings = bookingRepository.findByUserIdAndStatus(userId, status, pageable);
        } else {
            bookings = bookingRepository.findByUserId(userId, pageable);
        }
        return bookings.map(this::convertToDTO);
    }

    /**
     * Get all bookings for a resource
     */
    @Transactional(readOnly = true)
    public List<BookingDTO> getResourceBookings(Long resourceId) {
        return bookingRepository.findByResourceId(resourceId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    /**
     * Get all bookings with optional filters (Admin only)
     */
    @Transactional(readOnly = true)
    public Page<BookingDTO> getAllBookings(Long userId, Long resourceId, BookingStatus status, Pageable pageable) {
        Page<Booking> bookings = bookingRepository.findBookings(userId, resourceId, status, pageable);
        return bookings.map(this::convertToDTO);
    }

    /**
     * Get all pending bookings (Admin only)
     */
    @Transactional(readOnly = true)
    public Page<BookingDTO> getPendingBookings(Pageable pageable) {
        Page<Booking> bookings = bookingRepository.findByStatus(BookingStatus.PENDING, pageable);
        return bookings.map(this::convertToDTO);
    }

    /**
     * Approve booking request (Admin only)
     */
    public BookingDTO approveBooking(Long bookingId, Long adminId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("Only pending bookings can be approved. Current status: " + booking.getStatus());
        }

        // Verify no conflicts have occurred since booking was created
        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                booking.getResource().getId(),
                booking.getStartTime(),
                booking.getEndTime());

        // Remove this booking from conflicts check
        conflicts = conflicts.stream()
                .filter(b -> !b.getId().equals(bookingId))
                .toList();

        if (!conflicts.isEmpty()) {
            throw new BadRequestException("Scheduling conflict detected. Another booking was approved for this time slot.");
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found with id: " + adminId));

        booking.setStatus(BookingStatus.APPROVED);
        booking.setApprovedBy(admin);
        booking.setApprovedAt(LocalDateTime.now());

        booking = bookingRepository.save(booking);

        // Auto-reject any overlapping PENDING bookings for this resource — the slot is now locked.
        List<Booking> losers = bookingRepository.findOverlappingPendingBookings(
                booking.getResource().getId(),
                booking.getStartTime(),
                booking.getEndTime(),
                booking.getId());
        LocalDateTime now = LocalDateTime.now();
        for (Booking loser : losers) {
            loser.setStatus(BookingStatus.REJECTED);
            loser.setRejectionReason("A conflicting booking for this time slot was approved.");
            loser.setApprovedBy(admin);
            loser.setApprovedAt(now);
        }
        if (!losers.isEmpty()) {
            bookingRepository.saveAll(losers);
            for (Booking loser : losers) {
                eventPublisher.publishEvent(new BookingEvents.BookingRejected(
                        loser, adminId, loser.getRejectionReason()));
            }
        }

        eventPublisher.publishEvent(new BookingEvents.BookingApproved(booking, adminId));
        return convertToDTO(booking);
    }

    /**
     * Update a PENDING booking (owner or admin). Re-validates capacity and conflicts.
     * Status stays PENDING so admin reviews the latest version.
     */
    public BookingDTO updateBooking(Long bookingId, Long userId, CreateBookingRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        boolean isOwner = booking.getUser().getId().equals(userId);
        boolean isAdmin = user.getRole() == Role.ADMIN;
        if (!isOwner && !isAdmin) {
            throw new BadRequestException("You can only edit your own bookings");
        }

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("Only pending bookings can be edited. Current status: " + booking.getStatus());
        }

        if (request.getStartTime().isAfter(request.getEndTime())
                || request.getStartTime().equals(request.getEndTime())) {
            throw new BadRequestException("End time must be after start time");
        }

        Resource resource = resourceRepository.findById(request.getResourceId())
                .orElseThrow(() -> new ResourceNotFoundException("Resource not found with id: " + request.getResourceId()));

        if (resource.getCapacity() != null
                && request.getExpectedAttendees() != null
                && request.getExpectedAttendees() > resource.getCapacity()) {
            throw new BadRequestException(
                    "\"" + resource.getName() + "\" has a capacity of " + resource.getCapacity()
                            + ", but you entered " + request.getExpectedAttendees()
                            + " expected attendees. Please reduce the count or pick a larger facility.");
        }

        List<Booking> conflicts = bookingRepository.findConflictingBookings(
                request.getResourceId(),
                request.getStartTime(),
                request.getEndTime())
                .stream()
                .filter(b -> !b.getId().equals(bookingId))
                .toList();

        if (!conflicts.isEmpty()) {
            throw new BadRequestException(
                    "Resource is not available during the requested time range. " +
                    "There are " + conflicts.size() + " conflicting booking(s).");
        }

        booking.setResource(resource);
        booking.setStartTime(request.getStartTime());
        booking.setEndTime(request.getEndTime());
        booking.setPurpose(request.getPurpose());
        booking.setExpectedAttendees(request.getExpectedAttendees());

        booking = bookingRepository.save(booking);
        return convertToDTO(booking);
    }

    /**
     * Reject booking request (Admin only)
     */
    public BookingDTO rejectBooking(Long bookingId, Long adminId, String rejectionReason) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        if (booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("Only pending bookings can be rejected. Current status: " + booking.getStatus());
        }

        User admin = userRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found with id: " + adminId));

        booking.setStatus(BookingStatus.REJECTED);
        booking.setRejectionReason(rejectionReason);
        booking.setApprovedBy(admin);
        booking.setApprovedAt(LocalDateTime.now());

        booking = bookingRepository.save(booking);
        eventPublisher.publishEvent(new BookingEvents.BookingRejected(booking, adminId, rejectionReason));
        return convertToDTO(booking);
    }

    /**
     * Cancel approved booking (User can cancel own bookings, Admin can cancel any)
     */
    public BookingDTO cancelBooking(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found with id: " + bookingId));

        // Verify user is either the booking owner or an admin
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        if (!booking.getUser().getId().equals(userId) && !user.getRole().equals(Role.ADMIN)) {
            throw new BadRequestException("You can only cancel your own bookings");
        }

        if (booking.getStatus() != BookingStatus.APPROVED
                && booking.getStatus() != BookingStatus.PENDING) {
            throw new BadRequestException("Only pending or approved bookings can be cancelled. Current status: " + booking.getStatus());
        }

        // For APPROVED bookings the slot is locked, so block cancellation after the start time.
        // PENDING requests can always be withdrawn.
        if (booking.getStatus() == BookingStatus.APPROVED
                && booking.getStartTime().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("Cannot cancel bookings that have already started");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        booking.setCancelledAt(LocalDateTime.now());

        booking = bookingRepository.save(booking);
        eventPublisher.publishEvent(new BookingEvents.BookingCancelled(booking, userId));
        return convertToDTO(booking);
    }

    /**
     * Get available time slots for a resource
     */
    @Transactional(readOnly = true)
    public List<BookingDTO> getUpcomingBookings(Long resourceId) {
        return bookingRepository.findUpcomingBookings(resourceId)
                .stream()
                .map(this::convertToDTO)
                .toList();
    }

    /**
     * Convert Booking entity to DTO
     */
    private BookingDTO convertToDTO(Booking booking) {
        return BookingDTO.builder()
                .id(booking.getId())
                .userId(booking.getUser().getId())
                .userName(booking.getUser().getName())
                .userEmail(booking.getUser().getEmail())
                .resourceId(booking.getResource().getId())
                .resourceName(booking.getResource().getName())
                .locationName(booking.getResource().getLocation() != null
                        ? booking.getResource().getLocation().getDisplayName() : null)
                .startTime(booking.getStartTime())
                .endTime(booking.getEndTime())
                .purpose(booking.getPurpose())
                .expectedAttendees(booking.getExpectedAttendees())
                .status(booking.getStatus())
                .rejectionReason(booking.getRejectionReason())
                .approvedById(booking.getApprovedBy() != null ? booking.getApprovedBy().getId() : null)
                .approvedByName(booking.getApprovedBy() != null ? booking.getApprovedBy().getName() : null)
                .requestedAt(booking.getRequestedAt())
                .updatedAt(booking.getUpdatedAt())
                .approvedAt(booking.getApprovedAt())
                .cancelledAt(booking.getCancelledAt())
                .build();
    }
}
