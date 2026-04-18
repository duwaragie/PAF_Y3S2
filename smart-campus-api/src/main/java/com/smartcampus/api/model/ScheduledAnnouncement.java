package com.smartcampus.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * A notification composed in advance and fanned out at scheduledAt by a cron job.
 * Once dispatched, sentAt is set and the row is no longer picked up.
 */
@Entity
@Table(name = "scheduled_announcements",
        indexes = @Index(name = "idx_sa_due", columnList = "sentAt, scheduledAt"))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduledAnnouncement {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 1000)
    private String message;

    /** Deep link into the app (optional). */
    @Column(length = 255)
    private String link;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 8)
    private NotificationPriority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private AnnouncementAudience audience;

    @Column(nullable = false)
    private LocalDateTime scheduledAt;

    /** Null until the cron has dispatched this announcement. */
    @Column
    private LocalDateTime sentAt;

    /** How many users received the notification (for admin listing). */
    @Column
    private Integer recipientCount;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_id")
    private User createdBy;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
