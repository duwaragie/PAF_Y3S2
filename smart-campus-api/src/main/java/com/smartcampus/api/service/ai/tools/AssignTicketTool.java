package com.smartcampus.api.service.ai.tools;

import com.smartcampus.api.dto.TicketAssignDTO;
import com.smartcampus.api.dto.TicketResponseDTO;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.service.TicketService;
import com.smartcampus.api.service.ai.AiTool;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class AssignTicketTool implements AiTool {

    private final TicketService ticketService;
    private final ObjectMapper objectMapper;

    @Override public String name() { return "assign_ticket"; }

    @Override public String description() {
        return "Assigns a ticket to a technician (by user ID). ADMIN only. Enforces daily "
                + "per-technician limit. Two-step confirmation.";
    }

    @Override public boolean isAvailableFor(User user) {
        return user.getRole() == Role.ADMIN;
    }

    @Override public ObjectNode parametersSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        ObjectNode tid = props.putObject("ticketId");
        tid.put("type", "integer");
        ObjectNode aid = props.putObject("assignedToId");
        aid.put("type", "integer");
        aid.put("description", "User ID of the technician.");
        ObjectNode confirmed = props.putObject("confirmed");
        confirmed.put("type", "boolean");
        schema.putArray("required").add("ticketId").add("assignedToId");
        return schema;
    }

    @Override public Object execute(ObjectNode arguments, User currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            return Map.of("error", "forbidden", "message", "Only admins can assign tickets.");
        }
        if (arguments == null) return Map.of("error", "missing_arguments");

        long ticketId = arguments.path("ticketId").asLong(0);
        long assignedToId = arguments.path("assignedToId").asLong(0);
        if (ticketId <= 0 || assignedToId <= 0) {
            return Map.of("error", "missing_fields",
                    "message", "ticketId and assignedToId are required.");
        }

        boolean confirmed = arguments.path("confirmed").asBoolean(false);
        if (!confirmed) {
            Map<String, Object> preview = new LinkedHashMap<>();
            preview.put("ticketId", ticketId);
            preview.put("assignedToId", assignedToId);
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("confirmationRequired", true);
            out.put("preview", preview);
            out.put("instructions", "Confirm the assignment with the user, then call again with confirmed=true.");
            return out;
        }

        TicketAssignDTO dto = new TicketAssignDTO();
        dto.setAssignedToId(assignedToId);
        try {
            TicketResponseDTO updated = ticketService.assignTicket(ticketId, dto, currentUser);
            return Map.of("success", true,
                    "ticketId", updated.getId(),
                    "assignedToName", updated.getAssignedToName(),
                    "message", "Ticket #" + updated.getId() + " assigned to "
                            + updated.getAssignedToName() + ".");
        } catch (Exception e) {
            return Map.of("success", false, "error", "assign_failed", "message", e.getMessage());
        }
    }
}
