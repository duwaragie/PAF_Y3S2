package com.smartcampus.api.service.ai.tools;

import com.smartcampus.api.dto.EnrollmentDTO;
import com.smartcampus.api.model.Grade;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.service.EnrollmentService;
import com.smartcampus.api.service.ai.AiTool;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class SetGradeTool implements AiTool {

    private final EnrollmentService enrollmentService;
    private final ObjectMapper objectMapper;

    @Override public String name() { return "set_grade"; }

    @Override public String description() {
        return "Sets a grade on an enrollment. LECTURER (for their own offerings) or ADMIN only. "
                + "If the grade was already released, students are notified of the change. "
                + "Two-step confirmation. Grade labels: A+, A, A-, B+, B, B-, C+, C, C-, D+, D, F, I, W.";
    }

    @Override public boolean isAvailableFor(User user) {
        return user.getRole() == Role.ADMIN || user.getRole() == Role.LECTURER;
    }

    @Override public ObjectNode parametersSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        ObjectNode id = props.putObject("enrollmentId");
        id.put("type", "integer");
        ObjectNode grade = props.putObject("grade");
        grade.put("type", "string");
        grade.put("description", "Grade label, e.g. A+, A, B, C-, F, I, W.");
        ObjectNode reason = props.putObject("reason");
        reason.put("type", "string");
        reason.put("description", "Optional audit reason (recommended when editing a released grade).");
        ObjectNode confirmed = props.putObject("confirmed");
        confirmed.put("type", "boolean");
        schema.putArray("required").add("enrollmentId").add("grade");
        return schema;
    }

    @Override public Object execute(ObjectNode arguments, User currentUser) {
        if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.LECTURER) {
            return Map.of("error", "forbidden", "message", "Only lecturers and admins can set grades.");
        }
        if (arguments == null) return Map.of("error", "missing_arguments");
        long enrollmentId = arguments.path("enrollmentId").asLong(0);
        String gradeStr = arguments.path("grade").asString("").trim();
        if (enrollmentId <= 0 || gradeStr.isEmpty()) {
            return Map.of("error", "missing_fields", "message", "enrollmentId and grade are required.");
        }
        Grade grade = Grade.fromLabel(gradeStr);
        if (grade == null) {
            return Map.of("error", "invalid_grade",
                    "message", "Unrecognized grade label: " + gradeStr);
        }
        String reason = arguments.path("reason").asString("");

        boolean confirmed = arguments.path("confirmed").asBoolean(false);
        if (!confirmed) {
            Map<String, Object> preview = new LinkedHashMap<>();
            preview.put("enrollmentId", enrollmentId);
            preview.put("grade", grade.getLabel());
            if (!reason.isBlank()) preview.put("reason", reason);
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("confirmationRequired", true);
            out.put("preview", preview);
            out.put("instructions", "Confirm the grade with the lecturer, then call again with confirmed=true. "
                    + "If editing a released grade, the student is auto-notified.");
            return out;
        }
        try {
            EnrollmentDTO e = enrollmentService.setGrade(
                    enrollmentId, grade, reason.isBlank() ? null : reason, currentUser);
            return Map.of("success", true,
                    "enrollmentId", e.getId(),
                    "grade", e.getGradeLabel(),
                    "gradeReleased", e.getGradeReleased(),
                    "message", "Grade " + e.getGradeLabel() + " set on enrollment #" + e.getId() + ".");
        } catch (Exception e) {
            return Map.of("success", false, "error", "grade_failed", "message", e.getMessage());
        }
    }
}
