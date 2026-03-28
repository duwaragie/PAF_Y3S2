package com.smartcampus.api.repository;

import com.smartcampus.api.model.RefreshToken;
import com.smartcampus.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    Optional<RefreshToken> findByUser(User user);

    @org.springframework.data.jpa.repository.Modifying
    int deleteByUser(User user);
}
