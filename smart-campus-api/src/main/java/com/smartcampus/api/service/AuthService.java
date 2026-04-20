package com.smartcampus.api.service;

import com.smartcampus.api.dto.LoginRequest;
import com.smartcampus.api.dto.RegisterRequest;
import com.smartcampus.api.model.AuthProvider;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.UserRepository;
import com.smartcampus.api.security.JwtService;
import com.smartcampus.api.security.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.Map;
import java.util.HashMap;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final OtpService otpService;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UserService userService;

    @Transactional
    public void register(RegisterRequest request) {
        Optional<User> existingUserOpt = userRepository.findByEmailIgnoreCase(request.getEmail());

        User user;
        String hashedPassword = passwordEncoder.encode(request.getPassword());
        
        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            if (user.getAuthProvider() == AuthProvider.LOCAL || user.getAuthProvider() == AuthProvider.BOTH) {
                if (user.isEmailVerified()) {
                    throw new RuntimeException("Email already registered and verified. Please login.");
                }
            }
        } else {
            user = new User();
            user.setName(request.getName());
            user.setEmail(request.getEmail());
            user.setRole(Role.STUDENT);
            user.setAuthProvider(AuthProvider.LOCAL);
            user.setEmailVerified(false);
            user = userRepository.save(user); // need the ID before the OTP row
        }

        // Password is stored with the OTP and applied only on successful verification.
        otpService.generateAndSendOtp(user, hashedPassword);
    }

    public void verifyEmail(String email, String otp) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isEmailVerified() && user.getAuthProvider() == AuthProvider.LOCAL) {
            throw new RuntimeException("Email already verified");
        }

        Optional<com.smartcampus.api.model.OtpToken> tokenOpt = otpService.verifyOtpAndGetToken(user, otp);
        if (tokenOpt.isPresent()) {
            com.smartcampus.api.model.OtpToken token = tokenOpt.get();
            if (token.getTempPassword() != null) {
                user.setPassword(token.getTempPassword());
            }
            user.setEmailVerified(true);

            if (user.getAuthProvider() == AuthProvider.GOOGLE) {
                user.setAuthProvider(AuthProvider.BOTH);
            } else if (user.getAuthProvider() == null) {
                user.setAuthProvider(AuthProvider.LOCAL);
            }

            userRepository.save(user);
        } else {
            throw new RuntimeException("Invalid or expired OTP");
        }
    }

    public Map<String, Object> login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new RuntimeException("No account found with this email address."));

        if (!user.isEmailVerified()) {
            throw new RuntimeException("Email not verified. Please verify your email first.");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        String jwt = jwtService.generateToken(user);
        String refreshToken = refreshTokenService.createRefreshToken(user.getId()).getToken();

        Map<String, Object> response = new HashMap<>();
        response.put("accessToken", jwt);
        response.put("refreshToken", refreshToken);
        response.put("type", "Bearer");
        
        response.put("user", userService.convertToDTO(user));

        return response;
    }
}
