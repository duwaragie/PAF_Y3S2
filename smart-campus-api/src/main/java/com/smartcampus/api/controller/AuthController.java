package com.smartcampus.api.controller;

import com.smartcampus.api.dto.*;
import com.smartcampus.api.exception.TokenRefreshException;
import com.smartcampus.api.model.RefreshToken;
import com.smartcampus.api.model.User;
import com.smartcampus.api.service.AuthService;
import com.smartcampus.api.service.OtpService;
import com.smartcampus.api.service.PasswordResetService;
import com.smartcampus.api.service.UserService;
import jakarta.validation.Valid;
import com.smartcampus.api.security.JwtService;
import com.smartcampus.api.security.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;
    private final AuthService authService;
    private final OtpService otpService;
    private final PasswordResetService passwordResetService;

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request) {
        try {
            return ResponseEntity.ok(authService.login(request));
        } catch (RuntimeException e) {
            Map<String, String> response = new HashMap<>();
            String msg = e.getMessage();
            response.put("message", msg);

            // User not found
            if (msg != null && msg.contains("No account found")) {
                return ResponseEntity.status(404).body(response);
            }
            // Email not verified
            if (msg != null && msg.contains("not verified")) {
                return ResponseEntity.status(403).body(response);
            }
            // Bad credentials (wrong password)
            response.put("message", "Invalid password.");
            return ResponseEntity.status(401).body(response);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request) {
        try {
            authService.register(request);
            Map<String, String> response = new HashMap<>();
            response.put("message", "Registration successful. Please check your email for the OTP.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@Valid @RequestBody VerifyOtpRequest request) {
        try {
            authService.verifyEmail(request.getEmail(), request.getOtp());
            Map<String, String> response = new HashMap<>();
            response.put("message", "Email verified successfully. You can now login.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resendOtp(@Valid @RequestBody ResendOtpRequest request) {
        try {
            User user = userService.findByEmail(request.getEmail());
            otpService.generateAndSendOtp(user, null);
            Map<String, String> response = new HashMap<>();
            response.put("message", "A new verification code has been sent to your email.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            passwordResetService.initiatePasswordReset(request.getEmail());
        } catch (RuntimeException e) {
            // Only surface cooldown errors; silently succeed for other cases
            if (e.getMessage().contains("wait")) {
                Map<String, String> response = new HashMap<>();
                response.put("error", e.getMessage());
                return ResponseEntity.badRequest().body(response);
            }
        }
        // Always return same message to prevent user enumeration
        Map<String, String> response = new HashMap<>();
        response.put("message", "If an account exists with that email, a reset link has been sent.");
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            passwordResetService.resetPassword(request.getEmail(), request.getToken(), request.getNewPassword());
            Map<String, String> response = new HashMap<>();
            response.put("message", "Password reset successfully. You can now log in.");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, String> response = new HashMap<>();
            response.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(response);
        }
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, String>> getStatus() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "running");
        response.put("phase", "oauth2");
        return ResponseEntity.ok(response);
    }

    @GetMapping("/me")
    public ResponseEntity<UserDTO> getCurrentUser(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        return ResponseEntity.ok(userService.convertToDTO(user));
    }

    @PostMapping("/refreshtoken")
    public ResponseEntity<TokenRefreshResponse> refreshtoken(@RequestBody TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(oldToken -> {
                    RefreshToken newToken = refreshTokenService.rotateRefreshToken(oldToken);
                    String accessToken = jwtService.generateToken(newToken.getUser());
                    return ResponseEntity.ok(new TokenRefreshResponse(accessToken, newToken.getToken()));
                })
                .orElseThrow(() -> new TokenRefreshException(requestRefreshToken,
                        "Refresh token is not in database!"));
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        refreshTokenService.deleteByUserId(user.getId());

        Map<String, String> response = new HashMap<>();
        response.put("message", "Logged out successfully");
        return ResponseEntity.ok(response);
    }
}
