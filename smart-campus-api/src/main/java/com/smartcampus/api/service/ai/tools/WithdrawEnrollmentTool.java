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
public class WithdrawEnrollmentTool implements AiTool {

    private final EnrollmentService enrollmentService;
    private final ObjectMapper objectMapper;

    @Override public String name() { return "withdraw_enrollment"; }

    @Override public String description() {
        return "Withdraws the current student from an enrollment (cannot be undone except by re-enrolling). "
                + "Students only. Completed enrollments cannot be withdrawn. STRONG two-step confirmation.";
    }

    @Override public boolean isAvailableFor(User user) {
        return user.getRole() == Role.STUDENT;
    }

    @Override public ObjectNode parametersSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        ObjectNode id = props.putObject("enrollmentId");
        id.put("type", "integer");
        ObjectNode confirmed = props.putObject("confirmed");
        confirmed.put("type", "boolean");
        schema.putArray("required").add("enrollmentId");
        return schema;
    }

    @Override public Object execute(ObjectNode arguments, User currentUser) {
        if (currentUser.getRole() != Role.STUDENT) {
            return Map.of("error", "forbidden", "message", "Only students can withdraw themselves.");
        }
        if (arguments == null) return Map.of("error", "missing_arguments");
        long enrollmentId = arguments.path("enrollmentId").asLong(0);
        if (enrollmentId <= 0) return Map.of("error", "missing_enrollmentId");

        boolean confirmed = arguments.path("confirmed").asBoolean(false);
        if (!confirmed) {
            return Map.of(
                    "confirmationRequired", true,
                    "preview", Map.of("enrollmentId", enrollmentId,
                            "action", "WITHDRAW",
                            "warning", "You'll lose your seat. Re-enrolling later depends on availability."),
                    "instructions", "Warn the student this is serious and ask for explicit confirmation. "
                            + "Only on yes, call again with confirmed=true.");
        }
        try {
            EnrollmentDTO e = enrollmentService.withdraw(currentUser.getId(), enrollmentId);
            return Map.of("success", true,
                    "enrollmentId", e.getId(),
                    "status", e.getStatus(),
                    "message", "Withdrawn from " + e.getCourseCode() + " / " + e.getSectionLabel() + ".");
        } catch (Exception e) {
            return Map.of("success", false, "error", "withdraw_failed", "message", e.getMessage());
        }
    }
}
