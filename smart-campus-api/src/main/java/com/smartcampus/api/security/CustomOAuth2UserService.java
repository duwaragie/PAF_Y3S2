package com.smartcampus.api.security;

import com.smartcampus.api.model.AuditAction;
import com.smartcampus.api.model.AuthProvider;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.AccountSetupTokenRepository;
import com.smartcampus.api.repository.UserRepository;
import com.smartcampus.api.service.AuditService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.oauth2.client.userinfo.DefaultOAuth2UserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserRequest;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class CustomOAuth2UserService extends DefaultOAuth2UserService {

    private final UserRepository userRepository;
    private final AccountSetupTokenRepository accountSetupTokenRepository;
    private final AuditService auditService;

    @Override
    public OAuth2User loadUser(OAuth2UserRequest userRequest) throws OAuth2AuthenticationException {
        OAuth2User oAuth2User = super.loadUser(userRequest);
        Map<String, Object> attributes = oAuth2User.getAttributes();
        User user = resolveUser(attributes);
        return new CustomOAuth2User(user, attributes);
    }

    // Package-private so it can be unit-tested without spinning up OAuth2 machinery.
    User resolveUser(Map<String, Object> attributes) {
        String rawEmail = (String) attributes.get("email");
        if (rawEmail == null || rawEmail.isBlank()) {
            throw new OAuth2AuthenticationException(new OAuth2Error("email_missing", "Google account did not return an email.", null));
        }
        String email = rawEmail.trim().toLowerCase();
        String name = (String) attributes.get("name");
        String picture = (String) attributes.get("picture");
        String googleId = (String) attributes.get("sub");

        return userRepository.findByEmailIgnoreCase(email)
                .map(existingUser -> mergeExisting(existingUser, name, picture, googleId))
                .orElseGet(() -> createNewGoogleUser(email, name, picture, googleId));
    }

    private User mergeExisting(User existingUser, String name, String picture, String googleId) {
        // Reject OAuth linking while an admin-provisioned invite is still pending.
        // Allowing it would silently bypass the setup flow and mark the email verified
        // without the user ever setting a password.
        if (accountSetupTokenRepository.existsByUser(existingUser)) {
            auditService.log(existingUser, AuditAction.OAUTH_BLOCKED, "USER", String.valueOf(existingUser.getId()),
                    "pending account setup");
            throw new OAuth2AuthenticationException(new OAuth2Error(
                    "setup_required",
                    "Please complete your account setup via the invitation email before signing in with Google.",
                    null));
        }

        Role originalRole = existingUser.getRole();

        if (existingUser.getName() == null || existingUser.getName().isBlank()) {
            existingUser.setName(name);
        }
        if (existingUser.getPicture() == null || existingUser.getPicture().isBlank()) {
            existingUser.setPicture(picture);
        }
        existingUser.setGoogleId(googleId);
        existingUser.setEmailVerified(true);

        if (existingUser.getAuthProvider() == AuthProvider.LOCAL) {
            existingUser.setAuthProvider(AuthProvider.BOTH);
        } else if (existingUser.getAuthProvider() == null) {
            existingUser.setAuthProvider(AuthProvider.GOOGLE);
        }

        // Role must never change as a side-effect of OAuth.
        if (existingUser.getRole() != originalRole) {
            existingUser.setRole(originalRole);
        }

        User saved = userRepository.save(existingUser);
        log.info("OAuth linked existing user id={} role={} provider={}", saved.getId(), saved.getRole(), saved.getAuthProvider());
        auditService.log(saved, AuditAction.OAUTH_LINKED, "USER", String.valueOf(saved.getId()),
                "role=" + saved.getRole() + " provider=" + saved.getAuthProvider());
        return saved;
    }

    private User createNewGoogleUser(String email, String name, String picture, String googleId) {
        User newUser = new User();
        newUser.setEmail(email);
        newUser.setName(name);
        newUser.setPicture(picture);
        newUser.setGoogleId(googleId);
        newUser.setRole(Role.STUDENT);
        newUser.setAuthProvider(AuthProvider.GOOGLE);
        newUser.setEmailVerified(true);
        User saved = userRepository.save(newUser);
        log.info("OAuth created new user id={} role=STUDENT", saved.getId());
        auditService.log(saved, AuditAction.OAUTH_SIGNUP, "USER", String.valueOf(saved.getId()), "new student via Google");
        return saved;
    }
}
