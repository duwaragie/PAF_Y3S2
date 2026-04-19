package com.smartcampus.api.service.ai.tools;

import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.service.EnrollmentService;
import com.smartcampus.api.service.ai.AiTool;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class ReleaseGradesTool implements AiTool {

    private final EnrollmentService enrollmentService;
    private final ObjectMapper objectMapper;

    @Override public String name() { return "release_grades_for_offering"; }

    @Override public String description() {
        return "Releases all already-graded enrollments for a course offering (students get notified). "
                + "LECTURER (of that offering) or ADMIN only. STRONG two-step confirmation: once released, "
                + "every change is auditable and students are re-notified.";
    }

    @Override public boolean isAvailableFor(User user) {
        return user.getRole() == Role.ADMIN || user.getRole() == Role.LECTURER;
    }

    @Override public ObjectNode parametersSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        ObjectNode id = props.putObject("offeringId");
        id.put("type", "integer");
        ObjectNode confirmed = props.putObject("confirmed");
        confirmed.put("type", "boolean");
        schema.putArray("required").add("offeringId");
        return schema;
    }

    @Override public Object execute(ObjectNode arguments, User currentUser) {
        if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.LECTURER) {
            return Map.of("error", "forbidden", "message", "Only lecturers and admins can release grades.");
        }
        if (arguments == null) return Map.of("error", "missing_arguments");
        long offeringId = arguments.path("offeringId").asLong(0);
        if (offeringId <= 0) return Map.of("error", "missing_offeringId");

        boolean confirmed = arguments.path("confirmed").asBoolean(false);
        if (!confirmed) {
            return Map.of(
                    "confirmationRequired", true,
                    "preview", Map.of("offeringId", offeringId,
                            "action", "RELEASE ALL GRADES",
                            "warning", "Students will be notified immediately. Changes after release are audited."),
                    "instructions", "Warn the lecturer this is a high-impact action. Confirm, then call again with confirmed=true.");
        }
        try {
            int count = enrollmentService.releaseGradesForOffering(offeringId, currentUser);
            return Map.of("success", true, "released", count,
                    "message", "Released " + count + " grade(s) for offering #" + offeringId + ".");
        } catch (Exception e) {
            return Map.of("success", false, "error", "release_failed", "message", e.getMessage());
        }
    }
}
