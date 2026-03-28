package com.smartcampus.api.repository;

import com.smartcampus.api.model.OtpToken;
import com.smartcampus.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OtpTokenRepository extends JpaRepository<OtpToken, Long> {
    Optional<OtpToken> findByUserAndOtpCode(User user, String otpCode);
    void deleteByUser(User user);
}
