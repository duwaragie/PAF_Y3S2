package com.smartcampus.api.service.ai.tools;

import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.service.TicketService;
import com.smartcampus.api.service.ai.AiTool;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.util.Map;

@Component
@RequiredArgsConstructor
public class DeleteTicketCommentTool implements AiTool {

    private final TicketService ticketService;
    private final ObjectMapper objectMapper;

    @Override public String name() { return "delete_ticket_comment"; }

    @Override public String description() {
        return "Deletes a ticket comment. Author can delete their own; admins can delete any. "
                + "DESTRUCTIVE \u2014 two-step confirmation.";
    }

    @Override public boolean isAvailableFor(User user) {
        return user.getRole() == Role.STUDENT;
    }

    @Override public ObjectNode parametersSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        ObjectNode tid = props.putObject("ticketId");
        tid.put("type", "integer");
        ObjectNode cid = props.putObject("commentId");
        cid.put("type", "integer");
        ObjectNode confirmed = props.putObject("confirmed");
        confirmed.put("type", "boolean");
        schema.putArray("required").add("ticketId").add("commentId");
        return schema;
    }

    @Override public Object execute(ObjectNode arguments, User currentUser) {
        if (arguments == null) return Map.of("error", "missing_arguments");
        long ticketId = arguments.path("ticketId").asLong(0);
        long commentId = arguments.path("commentId").asLong(0);
        if (ticketId <= 0 || commentId <= 0) {
            return Map.of("error", "missing_fields", "message", "ticketId and commentId are required.");
        }

        boolean confirmed = arguments.path("confirmed").asBoolean(false);
        if (!confirmed) {
            return Map.of(
                    "confirmationRequired", true,
                    "preview", Map.of("ticketId", ticketId, "commentId", commentId,
                            "action", "DELETE COMMENT",
                            "warning", "This cannot be undone."),
                    "instructions", "Warn the user this is permanent. Confirm, then call again with confirmed=true.");
        }
        try {
            ticketService.deleteComment(ticketId, commentId, currentUser);
            return Map.of("success", true,
                    "message", "Comment #" + commentId + " deleted.");
        } catch (Exception e) {
            return Map.of("success", false, "error", "delete_failed", "message", e.getMessage());
        }
    }
}
