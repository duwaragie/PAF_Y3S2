package com.smartcampus.api.repository;

import com.smartcampus.api.model.Booking;
import com.smartcampus.api.model.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    /**
     * Find all bookings for a specific user
     */
    List<Booking> findByUserId(Long userId);
    
    /**
     * Find all bookings for a specific user with pagination
     */
    Page<Booking> findByUserId(Long userId, Pageable pageable);
    
    /**
     * Find all bookings for a specific resource
     */
    List<Booking> findByResourceId(Long resourceId);
    
    /**
     * Check for HARD scheduling conflicts — only APPROVED bookings lock the slot.
     * PENDING requests do not block other requests; admins choose between competing PENDING ones.
     */
    @Query("SELECT b FROM Booking b WHERE b.resource.id = :resourceId " +
           "AND b.status = 'APPROVED' " +
           "AND b.startTime < :endTime " +
           "AND b.endTime > :startTime")
    List<Booking> findConflictingBookings(
            @Param("resourceId") Long resourceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime);

    /**
     * Find overlapping PENDING bookings for the same resource (used when approving one
     * so we can auto-reject the losers).
     */
    @Query("SELECT b FROM Booking b WHERE b.resource.id = :resourceId " +
           "AND b.status = 'PENDING' " +
           "AND b.id <> :excludeBookingId " +
           "AND b.startTime < :endTime " +
           "AND b.endTime > :startTime")
    List<Booking> findOverlappingPendingBookings(
            @Param("resourceId") Long resourceId,
            @Param("startTime") LocalDateTime startTime,
            @Param("endTime") LocalDateTime endTime,
            @Param("excludeBookingId") Long excludeBookingId);
    
    /**
     * Find bookings by status
     */
    List<Booking> findByStatus(BookingStatus status);
    
    /**
     * Find all pending bookings with pagination
     */
    Page<Booking> findByStatus(BookingStatus status, Pageable pageable);
    
    /**
     * Find bookings by resource and status
     */
    List<Booking> findByResourceIdAndStatus(Long resourceId, BookingStatus status);
    
    /**
     * Find bookings by user and status with pagination
     */
    Page<Booking> findByUserIdAndStatus(Long userId, BookingStatus status, Pageable pageable);
    
    /**
     * Find all bookings with optional filtering
     */
    @Query("SELECT b FROM Booking b WHERE " +
           "(:userId IS NULL OR b.user.id = :userId) AND " +
           "(:resourceId IS NULL OR b.resource.id = :resourceId) AND " +
           "(:status IS NULL OR b.status = :status)")
    Page<Booking> findBookings(
            @Param("userId") Long userId,
            @Param("resourceId") Long resourceId,
            @Param("status") BookingStatus status,
            Pageable pageable);
    
    /**
     * Find upcoming bookings for a resource
     */
    @Query("SELECT b FROM Booking b WHERE b.resource.id = :resourceId " +
           "AND b.status IN ('APPROVED', 'PENDING') " +
           "AND b.startTime >= CURRENT_TIMESTAMP " +
           "ORDER BY b.startTime ASC")
    List<Booking> findUpcomingBookings(@Param("resourceId") Long resourceId);
    
    /**
     * Find bookings that need attention (old pending bookings)
     */
    @Query("SELECT b FROM Booking b WHERE b.status = 'PENDING' " +
           "AND b.requestedAt < :cutoffTime " +
           "ORDER BY b.requestedAt ASC")
    List<Booking> findOldPendingBookings(@Param("cutoffTime") LocalDateTime cutoffTime);
}
