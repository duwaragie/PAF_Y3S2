package com.smartcampus.api.service;

import com.smartcampus.api.dto.AccountSetupCompleteRequest;
import com.smartcampus.api.dto.AccountSetupValidationResponse;
import com.smartcampus.api.model.AccountSetupToken;
import com.smartcampus.api.model.AuditAction;
import com.smartcampus.api.model.AuthProvider;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.AccountSetupTokenRepository;
import com.smartcampus.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class AccountSetupService {

    private static final int EXPIRY_HOURS = 48;
    private static final int MAX_ATTEMPTS = 5;

    private final AccountSetupTokenRepository setupTokenRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuditService auditService;

    @Value("${app.frontend.url}")
    private String frontendUrl;

    @Transactional
    public String issueInvite(User user) {
        setupTokenRepository.deleteByUser(user);

        String rawToken = UUID.randomUUID().toString();
        String tokenHash = passwordEncoder.encode(rawToken);

        AccountSetupToken token = AccountSetupToken.builder()
                .user(user)
                .tokenHash(tokenHash)
                .expiryDate(Instant.now().plusSeconds(EXPIRY_HOURS * 3600L))
                .attempts(0)
                .build();
        setupTokenRepository.save(token);

        String base = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
        String setupUrl = base + "/account-setup?token=" + rawToken;
        emailService.sendAccountInviteEmail(user.getEmail(), user.getName(), user.getRole().name(), setupUrl, EXPIRY_HOURS);
        auditService.logCurrent(AuditAction.ACCOUNT_INVITED, "USER", String.valueOf(user.getId()),
                "email=" + user.getEmail() + " role=" + user.getRole());
        return setupUrl;
    }

    public AccountSetupValidationResponse validate(String rawToken) {
        AccountSetupToken token = findValidTokenOrThrow(rawToken);
        User user = token.getUser();
        return new AccountSetupValidationResponse(user.getEmail(), user.getName(), user.getRole());
    }

    @Transactional
    public void complete(AccountSetupCompleteRequest request) {
        AccountSetupToken token = findValidTokenOrThrow(request.getToken());
        User user = token.getUser();

        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmailVerified(true);
        if (user.getAuthProvider() == null) {
            user.setAuthProvider(AuthProvider.LOCAL);
        }
        userRepository.save(user);
        setupTokenRepository.delete(token);
        log.info("Account setup completed for user id={} role={}", user.getId(), user.getRole());
        auditService.log(user, AuditAction.ACCOUNT_SETUP_COMPLETED, "USER", String.valueOf(user.getId()),
                "role=" + user.getRole());
    }

    private AccountSetupToken findValidTokenOrThrow(String rawToken) {
        if (rawToken == null || rawToken.isBlank()) {
            throw new RuntimeException("Invalid setup link.");
        }
        // We have to scan since the token is hashed; in practice the table is tiny
        // (one row per pending invite) so this is fine.
        for (AccountSetupToken candidate : setupTokenRepository.findAll()) {
            if (candidate.getExpiryDate().isBefore(Instant.now())) continue;
            if (candidate.getAttempts() >= MAX_ATTEMPTS) continue;
            if (passwordEncoder.matches(rawToken, candidate.getTokenHash())) {
                return candidate;
            }
        }
        throw new RuntimeException("Invalid or expired setup link.");
    }

    public boolean isPendingSetup(User user) {
        return setupTokenRepository.existsByUser(user);
    }
}
