package com.smartcampus.api.repository;

import com.smartcampus.api.model.PasswordResetToken;
import com.smartcampus.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findByUser(User user);
    void deleteByUser(User user);
}
