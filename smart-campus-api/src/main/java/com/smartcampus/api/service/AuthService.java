package com.smartcampus.api.service;

import com.smartcampus.api.dto.LoginRequest;
import com.smartcampus.api.dto.RegisterRequest;
import com.smartcampus.api.dto.UserDTO;
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

    public void register(RegisterRequest request) {
        Optional<User> existingUserOpt = userRepository.findByEmail(request.getEmail());

        User user;
        String hashedPassword = passwordEncoder.encode(request.getPassword());
        
        if (existingUserOpt.isPresent()) {
            user = existingUserOpt.get();
            if (user.getAuthProvider() == AuthProvider.LOCAL || user.getAuthProvider() == AuthProvider.BOTH) {
                if (user.isEmailVerified()) {
                    throw new RuntimeException("Email already registered and verified. Please login.");
                }
            }
            // For unverified user, we can just save it again
        } else {
            user = new User();
            user.setName(request.getName());
            user.setEmail(request.getEmail());
            user.setRole(Role.STUDENT);
            user.setAuthProvider(AuthProvider.LOCAL);
            user.setEmailVerified(false);
            user = userRepository.save(user); // Save to get an ID for OTP token
        }

        // Send OTP with the temp password to be applied upon verification
        otpService.generateAndSendOtp(user, hashedPassword);
    }

    public void verifyEmail(String email, String otp) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.isEmailVerified() && user.getAuthProvider() == AuthProvider.LOCAL) {
            throw new RuntimeException("Email already verified");
        }

        Optional<com.smartcampus.api.model.OtpToken> tokenOpt = otpService.verifyOtpAndGetToken(user, otp);
        if (tokenOpt.isPresent()) {
            com.smartcampus.api.model.OtpToken token = tokenOpt.get();
            
            // Apply temp password
            if (token.getTempPassword() != null) {
                user.setPassword(token.getTempPassword());
            }

            user.setEmailVerified(true);
            
            // Adjust auth provider if it was originally Google
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
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String jwt = jwtService.generateToken(user);
        String refreshToken = refreshTokenService.createRefreshToken(user.getId()).getToken();

        Map<String, Object> response = new HashMap<>();
        response.put("token", jwt);
        response.put("refreshToken", refreshToken);
        response.put("type", "Bearer");
        
        UserDTO userDTO = new UserDTO();
        userDTO.setId(user.getId());
        userDTO.setEmail(user.getEmail());
        userDTO.setName(user.getName());
        userDTO.setRole(user.getRole());
        response.put("user", userDTO);

        return response;
    }
}
