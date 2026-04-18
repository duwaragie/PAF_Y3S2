package com.smartcampus.api.security;

import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Authenticates STOMP CONNECT frames from the JWT passed in the "Authorization" header.
 * The resolved user Principal is attached to the session so messages sent to
 * /user/{id}/queue/... are delivered to the right subscriber.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StompAuthChannelInterceptor implements ChannelInterceptor {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message;
        }

        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            log.debug("STOMP CONNECT rejected: no bearer token");
            return message;
        }
        String token = authHeader.substring(7);
        if (!jwtService.validateToken(token)) {
            log.debug("STOMP CONNECT rejected: invalid token");
            return message;
        }

        String email = jwtService.extractEmail(token);
        User user = userRepository.findByEmail(email).orElse(null);
        if (user == null) {
            log.debug("STOMP CONNECT rejected: user not found for {}", email);
            return message;
        }

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                user.getId().toString(),
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
        accessor.setUser(auth);
        return message;
    }
}
