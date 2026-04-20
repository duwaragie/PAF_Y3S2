package com.smartcampus.api.service.ai.tools;

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
public class MarkAllNotificationsReadTool implements AiTool {

    private final NotificationService notificationService;
    private final ObjectMapper objectMapper;

    @Override public String name() { return "mark_all_notifications_read"; }

    @Override public String description() {
        return "Marks ALL the user's unread notifications as read. Two-step confirmation because "
                + "it's bulk and can't be undone.";
    }

    @Override public boolean isAvailableFor(User user) {
        return user.getRole() == Role.STUDENT;
    }

    @Override public ObjectNode parametersSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        ObjectNode confirmed = props.putObject("confirmed");
        confirmed.put("type", "boolean");
        schema.putArray("required");
        return schema;
    }

    @Override public Object execute(ObjectNode arguments, User currentUser) {
        long unread = notificationService.unreadCount(currentUser.getId());
        boolean confirmed = arguments != null && arguments.path("confirmed").asBoolean(false);
        if (!confirmed) {
            return Map.of(
                    "confirmationRequired", true,
                    "preview", Map.of("unreadCount", unread,
                            "action", "MARK ALL AS READ"),
                    "instructions", "Tell the user how many notifications will be marked, confirm, "
                            + "then call again with confirmed=true.");
        }
        int updated = notificationService.markAllRead(currentUser.getId());
        return Map.of("success", true, "updated", updated,
                "message", "Marked " + updated + " notification(s) as read.");
    }
}
