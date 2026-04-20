package com.smartcampus.api.dto;

import com.smartcampus.api.model.AuditAction;
import com.smartcampus.api.model.AuditLog;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogDTO {
    private Long id;
    private Long actorId;
    private String actorEmail;
    private AuditAction action;
    private String targetType;
    private String targetId;
    private String details;
    private String ipAddress;
    private String userAgent;
    private LocalDateTime createdAt;

    public static AuditLogDTO from(AuditLog log) {
        return new AuditLogDTO(
                log.getId(),
                log.getActorId(),
                log.getActorEmail(),
                log.getAction(),
                log.getTargetType(),
                log.getTargetId(),
                log.getDetails(),
                log.getIpAddress(),
                log.getUserAgent(),
                log.getCreatedAt()
        );
    }
}
