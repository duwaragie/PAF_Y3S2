package com.smartcampus.api.service.ai.tools;

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
public class DeleteNotificationTool implements AiTool {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @Override public String name() { return "delete_notification"; }

    @Override public String description() {
        return "Permanently deletes a notification. Two-step confirmation.";
    }

    @Override public ObjectNode parametersSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        ObjectNode id = props.putObject("notificationId");
        id.put("type", "integer");
        ObjectNode confirmed = props.putObject("confirmed");
        confirmed.put("type", "boolean");
        schema.putArray("required").add("notificationId");
        return schema;
    }

    @Override public Object execute(ObjectNode arguments, User currentUser) {
        if (arguments == null) return Map.of("error", "missing_arguments");
        long notificationId = arguments.path("notificationId").asLong(0);
        if (notificationId <= 0) return Map.of("error", "missing_notificationId");

        boolean confirmed = arguments.path("confirmed").asBoolean(false);
        if (!confirmed) {
            return Map.of(
                    "confirmationRequired", true,
                    "preview", Map.of("notificationId", notificationId,
                            "action", "PERMANENTLY DELETE"),
                    "instructions", "Warn the user this is permanent, confirm, then call again with confirmed=true.");
        }
        try {
            notificationService.delete(currentUser.getId(), notificationId);
            return Map.of("success", true,
                    "message", "Notification #" + notificationId + " deleted.");
        } catch (Exception e) {
            return Map.of("success", false, "error", "delete_failed", "message", e.getMessage());
        }
    }
}
