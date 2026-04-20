package com.smartcampus.api.controller;

import com.smartcampus.api.dto.AuditLogDTO;
import com.smartcampus.api.model.AuditAction;
import com.smartcampus.api.model.AuditLog;
import com.smartcampus.api.repository.AuditLogRepository;
import jakarta.persistence.criteria.Predicate;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/audit")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AuditController {

    private final AuditLogRepository auditLogRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> list(
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        int clampedSize = Math.min(Math.max(size, 1), 200);
        Page<AuditLog> result = auditLogRepository.findAll(
                buildSpec(actor, action, from, to),
                PageRequest.of(Math.max(page, 0), clampedSize, Sort.by(Sort.Direction.DESC, "createdAt")));
        List<AuditLogDTO> items = result.getContent().stream().map(AuditLogDTO::from).toList();
        return ResponseEntity.ok(Map.of(
                "items", items,
                "page", result.getNumber(),
                "size", result.getSize(),
                "totalElements", result.getTotalElements(),
                "totalPages", result.getTotalPages()
        ));
    }

    @GetMapping("/actions")
    public ResponseEntity<AuditAction[]> actions() {
        return ResponseEntity.ok(AuditAction.values());
    }

    @GetMapping("/actors")
    public ResponseEntity<List<String>> actors() {
        // Distinct non-null actor emails that actually have entries.
        Specification<AuditLog> spec = (root, query, cb) -> {
            query.select(root.get("actorEmail")).distinct(true)
                    .orderBy(cb.asc(root.get("actorEmail")));
            return cb.isNotNull(root.get("actorEmail"));
        };
        List<String> emails = auditLogRepository.findAll(spec).stream()
                .map(AuditLog::getActorEmail)
                .filter(e -> e != null && !e.isBlank())
                .distinct()
                .sorted()
                .toList();
        return ResponseEntity.ok(emails);
    }

    @GetMapping(value = "/export", produces = "text/csv")
    public void exportCsv(
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime to,
            HttpServletResponse response) throws IOException {
        response.setContentType(MediaType.parseMediaType("text/csv").toString());
        response.setHeader("Content-Disposition",
                "attachment; filename=\"audit-" + DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss").format(LocalDateTime.now()) + ".csv\"");

        List<AuditLog> rows = auditLogRepository.findAll(
                buildSpec(actor, action, from, to),
                Sort.by(Sort.Direction.DESC, "createdAt"));
        try (PrintWriter w = response.getWriter()) {
            w.println("id,createdAt,actorId,actorEmail,action,targetType,targetId,ipAddress,userAgent,details");
            for (AuditLog r : rows) {
                w.print(r.getId()); w.print(',');
                w.print(csv(r.getCreatedAt() != null ? r.getCreatedAt().toString() : "")); w.print(',');
                w.print(r.getActorId() != null ? r.getActorId() : ""); w.print(',');
                w.print(csv(r.getActorEmail())); w.print(',');
                w.print(csv(r.getAction() != null ? r.getAction().name() : "")); w.print(',');
                w.print(csv(r.getTargetType())); w.print(',');
                w.print(csv(r.getTargetId())); w.print(',');
                w.print(csv(r.getIpAddress())); w.print(',');
                w.print(csv(r.getUserAgent())); w.print(',');
                w.println(csv(r.getDetails()));
            }
        }
    }

    private Specification<AuditLog> buildSpec(String actor, AuditAction action, LocalDateTime from, LocalDateTime to) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (actor != null && !actor.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("actorEmail")), actor.trim().toLowerCase()));
            }
            if (action != null) {
                predicates.add(cb.equal(root.get("action"), action));
            }
            if (from != null) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), from));
            }
            if (to != null) {
                predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), to));
            }
            return predicates.isEmpty() ? cb.conjunction() : cb.and(predicates.toArray(new Predicate[0]));
        };
    }

    private static String csv(String s) {
        if (s == null) return "";
        String escaped = s.replace("\"", "\"\"");
        return "\"" + escaped + "\"";
    }
}
