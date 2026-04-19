package com.smartcampus.api.service.ai.tools;

import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.service.CourseOfferingService;
import com.smartcampus.api.service.ai.AiTool;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class DeleteCourseOfferingTool implements AiTool {

    private final CourseOfferingService courseOfferingService;
    private final ObjectMapper objectMapper;

    @Override public String name() { return "delete_course_offering"; }

    @Override public String description() {
        return "Permanently deletes a course offering and all its sections. ADMIN only. "
                + "Refuses if there are active enrollments \u2014 close the offering instead. "
                + "DESTRUCTIVE, two-step confirmation.";
    }

    @Override public boolean isAvailableFor(User user) {
        return user.getRole() == Role.ADMIN;
    }

    @Override public ObjectNode parametersSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        props.putObject("offeringId").put("type", "integer");
        props.putObject("confirmed").put("type", "boolean");
        schema.putArray("required").add("offeringId");
        return schema;
    }

    @Override public Object execute(ObjectNode arguments, User currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            return Map.of("error", "forbidden", "message", "Only admins can delete offerings.");
        }
        if (arguments == null) return Map.of("error", "missing_arguments");
        long offeringId = arguments.path("offeringId").asLong(0);
        if (offeringId <= 0) return Map.of("error", "missing_offeringId");

        boolean confirmed = arguments.path("confirmed").asBoolean(false);
        if (!confirmed) {
            return Map.of(
                    "confirmationRequired", true,
                    "preview", Map.of("offeringId", offeringId,
                            "action", "PERMANENTLY DELETE (offering + sections)",
                            "warning", "Cannot be undone. Active enrollments block deletion."),
                    "instructions", "Warn admin this is permanent. Confirm, then call again with confirmed=true.");
        }
        try {
            courseOfferingService.delete(offeringId);
            return Map.of("success", true,
                    "message", "Offering #" + offeringId + " deleted.");
        } catch (Exception e) {
            return Map.of("success", false, "error", "delete_failed", "message", e.getMessage());
        }
    }
}
