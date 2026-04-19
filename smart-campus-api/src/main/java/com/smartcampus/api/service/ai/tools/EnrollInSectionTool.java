package com.smartcampus.api.service.ai.tools;

import com.smartcampus.api.dto.EnrollmentDTO;
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
public class EnrollInSectionTool implements AiTool {

    private final EnrollmentService enrollmentService;
    private final ObjectMapper objectMapper;

    @Override public String name() { return "enroll_in_section"; }

    @Override public String description() {
        return "Enrolls the current STUDENT in a course section. Validates prerequisites and seat "
                + "availability (falls back to waitlist if full). Students only. Two-step confirmation.";
    }

    @Override public boolean isAvailableFor(User user) {
        return user.getRole() == Role.STUDENT;
    }

    @Override public ObjectNode parametersSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        ObjectNode id = props.putObject("sectionId");
        id.put("type", "integer");
        ObjectNode confirmed = props.putObject("confirmed");
        confirmed.put("type", "boolean");
        schema.putArray("required").add("sectionId");
        return schema;
    }

    @Override public Object execute(ObjectNode arguments, User currentUser) {
        if (currentUser.getRole() != Role.STUDENT) {
            return Map.of("error", "forbidden", "message", "Only students can self-enroll.");
        }
        if (arguments == null) return Map.of("error", "missing_arguments");
        long sectionId = arguments.path("sectionId").asLong(0);
        if (sectionId <= 0) return Map.of("error", "missing_sectionId");

        boolean confirmed = arguments.path("confirmed").asBoolean(false);
        if (!confirmed) {
            return Map.of(
                    "confirmationRequired", true,
                    "preview", Map.of("sectionId", sectionId,
                            "action", "ENROLL",
                            "note", "If the section is full, you'll be added to the waitlist."),
                    "instructions", "Confirm with the student, then call again with confirmed=true.");
        }
        try {
            EnrollmentDTO e = enrollmentService.enroll(currentUser.getId(), sectionId);
            return Map.of("success", true,
                    "enrollmentId", e.getId(),
                    "status", e.getStatus(),
                    "courseCode", e.getCourseCode(),
                    "sectionLabel", e.getSectionLabel(),
                    "message", "Enrollment " + e.getStatus() + " for " + e.getCourseCode()
                            + " / " + e.getSectionLabel() + ".");
        } catch (Exception e) {
            return Map.of("success", false, "error", "enroll_failed", "message", e.getMessage());
        }
    }
}
