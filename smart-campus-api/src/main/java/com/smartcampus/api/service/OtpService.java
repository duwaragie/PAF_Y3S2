package com.smartcampus.api.service;

import com.smartcampus.api.model.OtpToken;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.OtpTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class OtpService {

    private static final int OTP_EXPIRY_MINUTES = 10;
    private static final int COOLDOWN_SECONDS = 60;
    private static final int MAX_ATTEMPTS = 5;

    private final OtpTokenRepository otpTokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public void generateAndSendOtp(User user, String tempPassword) {
        // Check cooldown: reject if last OTP was sent within 60 seconds
        Optional<OtpToken> existingToken = otpTokenRepository.findByUser(user);
        if (existingToken.isPresent()) {
            LocalDateTime cooldownThreshold = LocalDateTime.now().minusSeconds(COOLDOWN_SECONDS);
            if (existingToken.get().getCreatedAt().isAfter(cooldownThreshold)) {
                throw new RuntimeException("Please wait " + COOLDOWN_SECONDS + " seconds before requesting another code.");
            }
        }

        // Clear previous OTPs for this user
        otpTokenRepository.deleteByUser(user);

        // Generate 6-digit OTP using SecureRandom (range 100000-999999)
        String plainOtp = String.valueOf(secureRandom.nextInt(900_000) + 100_000);

        // Hash OTP with BCrypt before storing
        String hashedOtp = passwordEncoder.encode(plainOtp);

        OtpToken otpToken = new OtpToken();
        otpToken.setUser(user);
        otpToken.setOtpCode(hashedOtp);
        otpToken.setTempPassword(tempPassword);
        otpToken.setExpiryDate(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        otpToken.setAttempts(0);
        otpTokenRepository.save(otpToken);

        emailService.sendOtpEmail(user.getEmail(), plainOtp, OTP_EXPIRY_MINUTES);
    }

    public Optional<OtpToken> verifyOtpAndGetToken(User user, String otpCode) {
        Optional<OtpToken> otpTokenOpt = otpTokenRepository.findByUser(user);

        if (otpTokenOpt.isEmpty()) {
            return Optional.empty();
        }

        OtpToken token = otpTokenOpt.get();

        // Check expiry
        if (token.getExpiryDate().isBefore(LocalDateTime.now())) {
            otpTokenRepository.delete(token);
            return Optional.empty();
        }

        // Check attempt limit
        if (token.getAttempts() >= MAX_ATTEMPTS) {
            otpTokenRepository.delete(token);
            throw new RuntimeException("Maximum verification attempts exceeded. Please request a new code.");
        }

        // BCrypt compare
        if (passwordEncoder.matches(otpCode, token.getOtpCode())) {
            // Success — delete token and return it
            otpTokenRepository.delete(token);
            return Optional.of(token);
        } else {
            // Failed — increment attempts and save
            token.setAttempts(token.getAttempts() + 1);
            otpTokenRepository.save(token);
            return Optional.empty();
        }
    }
}
