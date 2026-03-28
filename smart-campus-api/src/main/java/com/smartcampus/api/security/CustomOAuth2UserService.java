package com.smartcampus.api.security;

import com.smartcampus.api.model.AuthProvider;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {
    
    private final UserRepository userRepository;
    
    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        
        Map<String, Object> attributes = oAuth2User.getAttributes();
        
        // Extract user information from Google
        String email = (String) attributes.get("email");
        String name = (String) attributes.get("name");
        String picture = (String) attributes.get("picture");
        String googleId = (String) attributes.get("sub");
        
        // Find or create user
        User user = userRepository.findByEmail(email)
                .map(existingUser -> {
                    // Update existing user / link account
                    existingUser.setName(name);
                    existingUser.setPicture(picture);
                    existingUser.setGoogleId(googleId);
                    existingUser.setEmailVerified(true);
                    
                    if (existingUser.getAuthProvider() == AuthProvider.LOCAL) {
                        existingUser.setAuthProvider(AuthProvider.BOTH);
                    } else if (existingUser.getAuthProvider() == null) {
                        existingUser.setAuthProvider(AuthProvider.GOOGLE);
                    }
                    
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> {
                    // Create new user
                    User newUser = new User();
                    newUser.setEmail(email);
                    newUser.setName(name);
                    newUser.setPicture(picture);
                    newUser.setGoogleId(googleId);
                    newUser.setRole(Role.STUDENT);
                    newUser.setAuthProvider(AuthProvider.GOOGLE);
                    newUser.setEmailVerified(true);
                    return userRepository.save(newUser);
                });
        
        return new CustomOAuth2User(user, attributes);
    }
}
