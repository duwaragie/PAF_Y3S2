package com.smartcampus.api.service.ai.tools;

import com.smartcampus.api.dto.CourseOfferingDTO;
import com.smartcampus.api.dto.CreateCourseOfferingRequest;
import com.smartcampus.api.model.CourseOfferingStatus;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.service.CourseOfferingService;
import com.smartcampus.api.service.ai.AiTool;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class UpdateCourseOfferingTool implements AiTool {

    private final CourseOfferingService courseOfferingService;
    private final ObjectMapper objectMapper;

    @Override public String name() { return "update_course_offering"; }

    @Override public String description() {
        return "Updates an existing course offering. ADMIN only. All fields must be provided "
                + "(full replacement). Two-step confirmation.";
    }

    @Override public boolean isAvailableFor(User user) {
        return user.getRole() == Role.ADMIN;
    }

    @Override public ObjectNode parametersSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        props.putObject("offeringId").put("type", "integer");
        props.putObject("code").put("type", "string");
        props.putObject("title").put("type", "string");
        props.putObject("description").put("type", "string");
        props.putObject("semester").put("type", "string");
        props.putObject("credits").put("type", "number");
        props.putObject("prerequisites").put("type", "string");
        ObjectNode status = props.putObject("status");
        status.put("type", "string");
        status.putArray("enum").add("DRAFT").add("OPEN").add("CLOSED").add("ARCHIVED");
        props.putObject("confirmed").put("type", "boolean");
        schema.putArray("required").add("offeringId").add("code").add("title").add("semester").add("credits");
        return schema;
    }

    @Override public Object execute(ObjectNode arguments, User currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            return Map.of("error", "forbidden", "message", "Only admins can update course offerings.");
        }
        if (arguments == null) return Map.of("error", "missing_arguments");
        long offeringId = arguments.path("offeringId").asLong(0);
        String code = arguments.path("code").asString("").trim();
        String title = arguments.path("title").asString("").trim();
        String semester = arguments.path("semester").asString("").trim();
        Double credits = null;
        JsonNode cNode = arguments.get("credits");
        if (cNode != null && cNode.isNumber()) credits = cNode.asDouble();
        if (offeringId <= 0 || code.isEmpty() || title.isEmpty() || semester.isEmpty() || credits == null) {
            return Map.of("error", "missing_fields");
        }

        CourseOfferingStatus status = null;
        JsonNode sNode = arguments.get("status");
        if (sNode != null && !sNode.isNull() && !sNode.asString().isBlank()) {
            try { status = CourseOfferingStatus.valueOf(sNode.asString().toUpperCase()); }
            catch (IllegalArgumentException ignored) {}
        }

        boolean confirmed = arguments.path("confirmed").asBoolean(false);
        if (!confirmed) {
            Map<String, Object> preview = new LinkedHashMap<>();
            preview.put("offeringId", offeringId);
            preview.put("code", code);
            preview.put("title", title);
            preview.put("semester", semester);
            preview.put("credits", credits);
            preview.put("status", status);
            preview.put("description", arguments.path("description").asString(""));
            preview.put("prerequisites", arguments.path("prerequisites").asString(""));
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("confirmationRequired", true);
            out.put("preview", preview);
            out.put("instructions", "Show the full updated offering, confirm, then call again with confirmed=true.");
            return out;
        }

        CreateCourseOfferingRequest req = new CreateCourseOfferingRequest();
        req.setCode(code);
        req.setTitle(title);
        req.setSemester(semester);
        req.setCredits(credits);
        req.setDescription(arguments.path("description").asString(null));
        req.setPrerequisites(arguments.path("prerequisites").asString(null));
        req.setStatus(status);
        try {
            CourseOfferingDTO updated = courseOfferingService.update(offeringId, req);
            return Map.of("success", true,
                    "offeringId", updated.getId(),
                    "message", "Updated offering " + updated.getCode() + ".");
        } catch (Exception e) {
            return Map.of("success", false, "error", "update_failed", "message", e.getMessage());
        }
    }
}
