package com.smartcampus.api.service;

import com.smartcampus.api.model.AuditAction;
import com.smartcampus.api.model.AuditLog;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.AuditLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(User actor, AuditAction action, String targetType, String targetId, String details) {
        log(actor != null ? actor.getId() : null,
            actor != null ? actor.getEmail() : null,
            action, targetType, targetId, details);
    }

    /** Resolves the actor from SecurityContextHolder. Use when the caller is a service triggered from an authenticated request. */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logCurrent(AuditAction action, String targetType, String targetId, String details) {
        User current = currentActor();
        log(current, action, targetType, targetId, details);
    }

    private User currentActor() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof User u) return u;
        return null;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void log(Long actorId, String actorEmail, AuditAction action, String targetType, String targetId, String details) {
        try {
            HttpServletRequest request = currentRequest();
            AuditLog entry = AuditLog.builder()
                    .actorId(actorId)
                    .actorEmail(actorEmail)
                    .action(action)
                    .targetType(targetType)
                    .targetId(targetId)
                    .details(truncate(details, 1000))
                    .ipAddress(request != null ? extractIp(request) : null)
                    .userAgent(request != null ? truncate(request.getHeader("User-Agent"), 255) : null)
                    .build();
            auditLogRepository.save(entry);
        } catch (Exception e) {
            // Audit must never break the request it is auditing.
            log.warn("Failed to write audit log action={} target={}/{}: {}", action, targetType, targetId, e.getMessage());
        }
    }

    private HttpServletRequest currentRequest() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            return attrs != null ? attrs.getRequest() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private String extractIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            int comma = forwarded.indexOf(',');
            return truncate((comma > 0 ? forwarded.substring(0, comma) : forwarded).trim(), 64);
        }
        return truncate(request.getRemoteAddr(), 64);
    }

    private String truncate(String value, int max) {
        if (value == null) return null;
        return value.length() <= max ? value : value.substring(0, max);
    }
}
