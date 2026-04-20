package com.smartcampus.api.service.ai.tools;

import com.smartcampus.api.dto.NotificationDTO;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.service.NotificationService;
import com.smartcampus.api.service.ai.AiTool;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class MarkNotificationReadTool implements AiTool {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @Override public String name() { return "mark_notification_read"; }

    @Override public String description() {
        return "Marks a single notification as read. Non-destructive \u2014 no confirmation needed.";
    }

    @Override public boolean isAvailableFor(User user) {
        return user.getRole() == Role.STUDENT;
    }

    @Override public ObjectNode parametersSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        ObjectNode id = props.putObject("notificationId");
        id.put("type", "integer");
        schema.putArray("required").add("notificationId");
        return schema;
    }

    @Override public Object execute(ObjectNode arguments, User currentUser) {
        if (arguments == null) return Map.of("error", "missing_arguments");
        long notificationId = arguments.path("notificationId").asLong(0);
        if (notificationId <= 0) return Map.of("error", "missing_notificationId");
        try {
            NotificationDTO dto = notificationService.markRead(currentUser.getId(), notificationId);
            return Map.of("success", true,
                    "notificationId", dto.getId(),
                    "message", "Marked as read.");
        } catch (Exception e) {
            return Map.of("success", false, "error", "mark_failed", "message", e.getMessage());
        }
    }
}
