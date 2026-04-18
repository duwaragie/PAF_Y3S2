package com.smartcampus.api.repository;

import com.smartcampus.api.model.ScheduledAnnouncement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.time.LocalDateTime;
import java.util.List;

public interface ScheduledAnnouncementRepository extends JpaRepository<ScheduledAnnouncement, Long> {

    @Query("SELECT a FROM ScheduledAnnouncement a WHERE a.sentAt IS NULL AND a.scheduledAt <= :now ORDER BY a.scheduledAt ASC")
    List<ScheduledAnnouncement> findDue(LocalDateTime now);

    List<ScheduledAnnouncement> findAllByOrderByScheduledAtDesc();
}
