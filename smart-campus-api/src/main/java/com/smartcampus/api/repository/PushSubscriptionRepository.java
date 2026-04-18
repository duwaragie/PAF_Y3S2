package com.smartcampus.api.repository;

import com.smartcampus.api.model.PushSubscription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface PushSubscriptionRepository extends JpaRepository<PushSubscription, Long> {

    List<PushSubscription> findByUserId(Long userId);

    Optional<PushSubscription> findByEndpoint(String endpoint);

    @Modifying
    @Query("DELETE FROM PushSubscription s WHERE s.endpoint = :endpoint")
    int deleteByEndpoint(String endpoint);

    @Modifying
    @Query("DELETE FROM PushSubscription s WHERE s.user.id = :userId")
    int deleteAllForUser(Long userId);
}
