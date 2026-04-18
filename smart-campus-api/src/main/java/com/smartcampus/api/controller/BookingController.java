package com.smartcampus.api.controller;

import com.smartcampus.api.dto.BookingDTO;
import com.smartcampus.api.dto.CreateBookingRequest;
import com.smartcampus.api.dto.ApproveBookingRequest;
import com.smartcampus.api.dto.RejectBookingRequest;
import com.smartcampus.api.model.BookingStatus;
import com.smartcampus.api.model.User;
import com.smartcampus.api.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    /**
     * Create a new booking request
     * POST /api/bookings
     */
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingDTO> createBooking(
            @Valid @RequestBody CreateBookingRequest request,
            Authentication authentication) {
        Long userId = ((User) authentication.getPrincipal()).getId();
        BookingDTO booking = bookingService.createBooking(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(booking);
    }

    /**
     * Get booking by ID
     * GET /api/bookings/{id}
     */
    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingDTO> getBooking(@PathVariable Long id) {
        return ResponseEntity.ok(bookingService.getBookingById(id));
    }

    /**
     * Update a PENDING booking (owner or admin)
     * PUT /api/bookings/{id}
     */
    @PutMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingDTO> updateBooking(
            @PathVariable Long id,
            @Valid @RequestBody CreateBookingRequest request,
            Authentication authentication) {
        Long userId = ((User) authentication.getPrincipal()).getId();
        BookingDTO booking = bookingService.updateBooking(id, userId, request);
        return ResponseEntity.ok(booking);
    }

    /**
     * Get all bookings for the authenticated user
     * GET /api/bookings/my-bookings
     * Query params: status, page, size, sort
     */
    @GetMapping("/my-bookings")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Page<BookingDTO>> getMyBookings(
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {
        Long userId = ((User) authentication.getPrincipal()).getId();
        Pageable pageable = PageRequest.of(page, size);
        Page<BookingDTO> bookings = bookingService.getUserBookings(userId, status, pageable);
        return ResponseEntity.ok(bookings);
    }

    /**
     * Get all bookings for a specific resource
     * GET /api/bookings/resource/{resourceId}
     */
    @GetMapping("/resource/{resourceId}")
    public ResponseEntity<List<BookingDTO>> getResourceBookings(@PathVariable Long resourceId) {
        List<BookingDTO> bookings = bookingService.getResourceBookings(resourceId);
        return ResponseEntity.ok(bookings);
    }

    /**
     * Get upcoming bookings for a resource
     * GET /api/bookings/resource/{resourceId}/upcoming
     */
    @GetMapping("/resource/{resourceId}/upcoming")
    public ResponseEntity<List<BookingDTO>> getUpcomingBookings(@PathVariable Long resourceId) {
        List<BookingDTO> bookings = bookingService.getUpcomingBookings(resourceId);
        return ResponseEntity.ok(bookings);
    }

    /**
     * Get all bookings (Admin only)
     * GET /api/bookings/admin/all
     * Query params: userId, resourceId, status, page, size
     */
    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<BookingDTO>> getAllBookings(
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) Long resourceId,
            @RequestParam(required = false) BookingStatus status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<BookingDTO> bookings = bookingService.getAllBookings(userId, resourceId, status, pageable);
        return ResponseEntity.ok(bookings);
    }

    /**
     * Get all pending bookings (Admin only)
     * GET /api/bookings/admin/pending
     */
    @GetMapping("/admin/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Page<BookingDTO>> getPendingBookings(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<BookingDTO> bookings = bookingService.getPendingBookings(pageable);
        return ResponseEntity.ok(bookings);
    }

    /**
     * Approve a booking request (Admin only)
     * POST /api/bookings/{id}/approve
     */
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingDTO> approveBooking(
            @PathVariable Long id,
            Authentication authentication) {
        Long adminId = ((User) authentication.getPrincipal()).getId();
        BookingDTO booking = bookingService.approveBooking(id, adminId);
        return ResponseEntity.ok(booking);
    }

    /**
     * Reject a booking request (Admin only)
     * POST /api/bookings/{id}/reject
     */
    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BookingDTO> rejectBooking(
            @PathVariable Long id,
            @Valid @RequestBody RejectBookingRequest request,
            Authentication authentication) {
        Long adminId = ((User) authentication.getPrincipal()).getId();
        BookingDTO booking = bookingService.rejectBooking(id, adminId, request.getRejectionReason());
        return ResponseEntity.ok(booking);
    }

    /**
     * Cancel an approved booking
     * POST /api/bookings/{id}/cancel
     * Users can cancel their own bookings, Admins can cancel any booking
     */
    @PostMapping("/{id}/cancel")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<BookingDTO> cancelBooking(
            @PathVariable Long id,
            Authentication authentication) {
        Long userId = ((User) authentication.getPrincipal()).getId();
        BookingDTO booking = bookingService.cancelBooking(id, userId);
        return ResponseEntity.ok(booking);
    }
}
