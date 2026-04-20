package com.smartcampus.api.service;

import com.smartcampus.api.model.AuditAction;
import com.smartcampus.api.model.PasswordResetToken;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.PasswordResetTokenRepository;
import com.smartcampus.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private static final int EXPIRY_MINUTES = 15;
    private static final int COOLDOWN_SECONDS = 60;
    private static final int MAX_ATTEMPTS = 5;

    private final PasswordResetTokenRepository resetTokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuditService auditService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Transactional
    public void initiatePasswordReset(String email) {
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);

        // Silent on unknown email — prevents account enumeration.
        if (userOpt.isEmpty()) {
            return;
        }

        User user = userOpt.get();

        Optional<PasswordResetToken> existingToken = resetTokenRepository.findByUser(user);
        if (existingToken.isPresent()) {
            LocalDateTime cooldownThreshold = LocalDateTime.now().minusSeconds(COOLDOWN_SECONDS);
            if (existingToken.get().getCreatedAt().isAfter(cooldownThreshold)) {
                throw new RuntimeException("Please wait " + COOLDOWN_SECONDS + " seconds before requesting another reset link.");
            }
        }

        resetTokenRepository.deleteByUser(user);

        String rawToken = UUID.randomUUID().toString();
        String hashedToken = passwordEncoder.encode(rawToken);

        PasswordResetToken resetToken = PasswordResetToken.builder()
                .user(user)
                .tokenHash(hashedToken)
                .expiryDate(Instant.now().plusSeconds(EXPIRY_MINUTES * 60L))
                .attempts(0)
                .build();
        resetTokenRepository.save(resetToken);

        String resetUrl = frontendUrl + "/reset-password?token=" + rawToken + "&email=" + email;
        emailService.sendPasswordResetEmail(email, resetUrl, EXPIRY_MINUTES);
        auditService.log(user, AuditAction.PASSWORD_RESET_REQUESTED, "USER", String.valueOf(user.getId()), null);
    }

    @Transactional
    public void resetPassword(String email, String rawToken, String newPassword) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("Invalid reset request."));

        PasswordResetToken token = resetTokenRepository.findByUser(user)
                .orElseThrow(() -> new RuntimeException("Invalid or expired reset link."));

        if (token.getExpiryDate().isBefore(Instant.now())) {
            resetTokenRepository.delete(token);
            throw new RuntimeException("Reset link has expired. Please request a new one.");
        }

        if (token.getAttempts() >= MAX_ATTEMPTS) {
            resetTokenRepository.delete(token);
            throw new RuntimeException("Maximum attempts exceeded. Please request a new reset link.");
        }

        if (!passwordEncoder.matches(rawToken, token.getTokenHash())) {
            token.setAttempts(token.getAttempts() + 1);
            resetTokenRepository.save(token);
            throw new RuntimeException("Invalid reset token.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        resetTokenRepository.delete(token);
        auditService.log(user, AuditAction.PASSWORD_RESET_COMPLETED, "USER", String.valueOf(user.getId()), null);
    }
}
