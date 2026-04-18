package com.smartcampus.api.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "course_offerings",
        uniqueConstraints = @UniqueConstraint(columnNames = {"code", "semester"}))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CourseOffering {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 32)
    private String code;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, length = 32)
    private String semester;

    @Column(nullable = false)
    private Double credits;

    @Column(nullable = false)
    private Integer capacity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lecturer_id")
    private User lecturer;

    /** Comma-separated course codes, e.g. "IT2030,IT2040". Kept as a string for simplicity. */
    @Column(length = 500)
    private String prerequisites;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private CourseOfferingStatus status;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
