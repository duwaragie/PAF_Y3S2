package com.smartcampus.api.service;

import com.smartcampus.api.model.OtpToken;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.OtpTokenRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Random;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final OtpTokenRepository otpTokenRepository;
    private final JavaMailSender mailSender;

    @Transactional
    public void generateAndSendOtp(User user, String tempPassword) {
        // Clear previous OTPs
        otpTokenRepository.deleteByUser(user);

        // Generate 6-digit OTP
        String otp = String.format("%06d", new Random().nextInt(999999));

        OtpToken otpToken = new OtpToken();
        otpToken.setUser(user);
        otpToken.setOtpCode(otp);
        otpToken.setTempPassword(tempPassword);
        otpToken.setExpiryDate(LocalDateTime.now().plusMinutes(10));
        otpTokenRepository.save(otpToken);

        sendOtpEmail(user.getEmail(), otp);
    }

    private void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Your Smart Campus Verification Code");
        message.setText("Your OTP code is: " + otp + "\nIt will expire in 10 minutes.");
        mailSender.send(message);
    }

    public Optional<OtpToken> verifyOtpAndGetToken(User user, String otpCode) {
        Optional<OtpToken> otpTokenOpt = otpTokenRepository.findByUserAndOtpCode(user, otpCode);

        if (otpTokenOpt.isPresent()) {
            OtpToken token = otpTokenOpt.get();
            if (token.getExpiryDate().isAfter(LocalDateTime.now())) {
                otpTokenRepository.delete(token);
                return Optional.of(token);
            } else {
                otpTokenRepository.delete(token); // Cleanup expired
            }
        }
        return Optional.empty();
    }
}
