package com.smartcampus.api.security;

import com.smartcampus.api.model.AuthProvider;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.AccountSetupTokenRepository;
import com.smartcampus.api.repository.UserRepository;
import com.smartcampus.api.service.AuditService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;

import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CustomOAuth2UserServiceTest {

    @Mock
    UserRepository userRepository;

    @Mock
    AccountSetupTokenRepository accountSetupTokenRepository;

    @Mock
    AuditService auditService;

    @InjectMocks
    CustomOAuth2UserService service;

    private Map<String, Object> googleAttrs(String email) {
        return Map.of(
                "email", email,
                "name", "Duwaragie Test",
                "picture", "https://example.com/p.jpg",
                "sub", "google-sub-123"
        );
    }

    @BeforeEach
    void setupSaveEcho() {
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void existingLecturerKeepsRoleWhenLoggingInViaOAuth() {
        User lecturer = new User();
        lecturer.setId(1L);
        lecturer.setEmail("lecturer@example.com");
        lecturer.setRole(Role.LECTURER);
        lecturer.setAuthProvider(AuthProvider.LOCAL);
        lecturer.setEmailVerified(true);
        lecturer.setPassword("hashed");

        when(userRepository.findByEmailIgnoreCase("lecturer@example.com")).thenReturn(Optional.of(lecturer));
        when(accountSetupTokenRepository.existsByUser(lecturer)).thenReturn(false);

        User result = service.resolveUser(googleAttrs("lecturer@example.com"));

        assertThat(result.getRole()).isEqualTo(Role.LECTURER);
        assertThat(result.getAuthProvider()).isEqualTo(AuthProvider.BOTH);
        assertThat(result.isEmailVerified()).isTrue();
        assertThat(result.getGoogleId()).isEqualTo("google-sub-123");
    }

    @Test
    void mixedCaseEmailStillMatchesExistingAccount() {
        User admin = new User();
        admin.setId(2L);
        admin.setEmail("admin@example.com");
        admin.setRole(Role.ADMIN);
        admin.setAuthProvider(AuthProvider.LOCAL);
        admin.setEmailVerified(true);

        // Google returns mixed case; service must lowercase before lookup.
        when(userRepository.findByEmailIgnoreCase("admin@example.com")).thenReturn(Optional.of(admin));
        when(accountSetupTokenRepository.existsByUser(admin)).thenReturn(false);

        User result = service.resolveUser(googleAttrs("Admin@Example.COM"));

        assertThat(result.getRole()).isEqualTo(Role.ADMIN);
        assertThat(result.getId()).isEqualTo(2L);
    }

    @Test
    void oauthBlockedWhileAdminInviteStillPending() {
        User pending = new User();
        pending.setId(3L);
        pending.setEmail("pending@example.com");
        pending.setRole(Role.TECHNICAL_STAFF);
        pending.setAuthProvider(AuthProvider.LOCAL);
        pending.setEmailVerified(false);

        when(userRepository.findByEmailIgnoreCase("pending@example.com")).thenReturn(Optional.of(pending));
        when(accountSetupTokenRepository.existsByUser(pending)).thenReturn(true);

        assertThatThrownBy(() -> service.resolveUser(googleAttrs("pending@example.com")))
                .isInstanceOf(OAuth2AuthenticationException.class)
                .hasMessageContaining("setup");
    }

    @Test
    void brandNewGoogleLoginCreatesStudent() {
        when(userRepository.findByEmailIgnoreCase("fresh@example.com")).thenReturn(Optional.empty());

        User result = service.resolveUser(googleAttrs("fresh@example.com"));

        assertThat(result.getRole()).isEqualTo(Role.STUDENT);
        assertThat(result.getAuthProvider()).isEqualTo(AuthProvider.GOOGLE);
        assertThat(result.getEmail()).isEqualTo("fresh@example.com");
    }
}
