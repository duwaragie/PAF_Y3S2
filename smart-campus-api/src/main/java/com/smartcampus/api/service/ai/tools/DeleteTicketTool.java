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
public class DeleteTicketTool implements AiTool {

    private final TicketService ticketService;
    private final ObjectMapper objectMapper;

    @Override public String name() { return "delete_ticket"; }

    @Override public String description() {
        return "Permanently deletes a ticket. ADMIN only. DESTRUCTIVE \u2014 requires strong confirmation. "
                + "Use sparingly; closing is usually preferred over deleting.";
    }

    @Override public boolean isAvailableFor(User user) {
        return user.getRole() == Role.ADMIN;
    }

    @Override public ObjectNode parametersSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        ObjectNode id = props.putObject("ticketId");
        id.put("type", "integer");
        ObjectNode confirmed = props.putObject("confirmed");
        confirmed.put("type", "boolean");
        schema.putArray("required").add("ticketId");
        return schema;
    }

    @Override public Object execute(ObjectNode arguments, User currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            return Map.of("error", "forbidden", "message", "Only admins can delete tickets.");
        }
        if (arguments == null) return Map.of("error", "missing_arguments");
        long ticketId = arguments.path("ticketId").asLong(0);
        if (ticketId <= 0) return Map.of("error", "missing_ticketId");

        boolean confirmed = arguments.path("confirmed").asBoolean(false);
        if (!confirmed) {
            return Map.of(
                    "confirmationRequired", true,
                    "preview", Map.of("ticketId", ticketId,
                            "action", "PERMANENTLY DELETE",
                            "warning", "This cannot be undone. All comments and images will be lost."),
                    "instructions", "Warn the user clearly that this is permanent. Ask for explicit yes. "
                            + "Only then call again with confirmed=true.");
        }
        try {
            ticketService.deleteTicket(ticketId, currentUser);
            return Map.of("success", true, "message", "Ticket #" + ticketId + " deleted.");
        } catch (Exception e) {
            return Map.of("success", false, "error", "delete_failed", "message", e.getMessage());
        }
    }
}
