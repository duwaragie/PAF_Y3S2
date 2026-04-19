package com.smartcampus.api.service.ai.tools;

import com.smartcampus.api.dto.CourseOfferingDTO;
import com.smartcampus.api.model.CourseOfferingStatus;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.service.CourseOfferingService;
import com.smartcampus.api.service.ai.AiTool;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class UpdateOfferingStatusTool implements AiTool {

    private final CourseOfferingService courseOfferingService;
    private final ObjectMapper objectMapper;

    @Override public String name() { return "update_offering_status"; }

    @Override public String description() {
        return "Changes just the status of a course offering (DRAFT/OPEN/CLOSED/ARCHIVED). ADMIN only. "
                + "Opening an offering allows student enrollment. Two-step confirmation.";
    }

    @Override public boolean isAvailableFor(User user) {
        return user.getRole() == Role.ADMIN;
    }

    @Override public ObjectNode parametersSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        props.putObject("offeringId").put("type", "integer");
        ObjectNode s = props.putObject("status");
        s.put("type", "string");
        s.putArray("enum").add("DRAFT").add("OPEN").add("CLOSED").add("ARCHIVED");
        props.putObject("confirmed").put("type", "boolean");
        schema.putArray("required").add("offeringId").add("status");
        return schema;
    }

    @Override public Object execute(ObjectNode arguments, User currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            return Map.of("error", "forbidden",
                    "message", "Only admins can change offering status.");
        }
        if (arguments == null) return Map.of("error", "missing_arguments");
        long offeringId = arguments.path("offeringId").asLong(0);
        String statusStr = arguments.path("status").asString("").trim().toUpperCase();
        if (offeringId <= 0 || statusStr.isEmpty()) {
            return Map.of("error", "missing_fields");
        }
        CourseOfferingStatus status;
        try {
            status = CourseOfferingStatus.valueOf(statusStr);
        } catch (IllegalArgumentException e) {
            return Map.of("error", "invalid_status", "message", e.getMessage());
        }

        boolean confirmed = arguments.path("confirmed").asBoolean(false);
        if (!confirmed) {
            Map<String, Object> preview = new LinkedHashMap<>();
            preview.put("offeringId", offeringId);
            preview.put("newStatus", status);
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("confirmationRequired", true);
            out.put("preview", preview);
            out.put("instructions", "Confirm status change with admin, then call again with confirmed=true.");
            return out;
        }
        try {
            CourseOfferingDTO updated = courseOfferingService.updateStatus(offeringId, status);
            return Map.of("success", true,
                    "offeringId", updated.getId(),
                    "status", updated.getStatus(),
                    "message", "Offering " + updated.getCode() + " is now " + updated.getStatus() + ".");
        } catch (Exception e) {
            return Map.of("success", false, "error", "status_failed", "message", e.getMessage());
        }
    }
}
