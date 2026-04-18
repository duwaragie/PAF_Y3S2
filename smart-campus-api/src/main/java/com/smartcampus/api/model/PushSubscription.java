package com.smartcampus.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * One browser's Web Push endpoint + keys, owned by a user. A user can have
 * many (phone, laptop, etc.). Unique on endpoint — re-subscribing from the
 * same browser updates the same row.
 */
@Entity
@Table(name = "push_subscriptions",
        indexes = @Index(name = "idx_push_sub_user", columnList = "user_id"),
        uniqueConstraints = @UniqueConstraint(columnNames = "endpoint"))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PushSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 500)
    private String endpoint;

    @Column(nullable = false, length = 255)
    private String p256dh;

    @Column(nullable = false, length = 64)
    private String auth;

    @Column(length = 255)
    private String userAgent;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
