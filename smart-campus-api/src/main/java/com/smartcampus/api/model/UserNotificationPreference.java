package com.smartcampus.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Per-user channel toggles. In-app is always on (not stored) — users can't
 * disable it, so notifications always reach them somewhere. Email and push
 * are opt-in/out.
 */
@Entity
@Table(name = "user_notification_preferences",
        uniqueConstraints = @UniqueConstraint(columnNames = "user_id"))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserNotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false)
    @Builder.Default
    private Boolean email = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean push = false;
}
