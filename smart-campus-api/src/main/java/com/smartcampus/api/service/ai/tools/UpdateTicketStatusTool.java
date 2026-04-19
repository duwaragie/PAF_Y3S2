package com.smartcampus.api.service.ai.tools;

import com.smartcampus.api.dto.TicketResponseDTO;
import com.smartcampus.api.dto.TicketStatusUpdateDTO;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.TicketStatus;
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
public class UpdateTicketStatusTool implements AiTool {

    private final TicketService ticketService;
    private final ObjectMapper objectMapper;

    @Override public String name() { return "update_ticket_status"; }

    @Override public String description() {
        return "Updates a ticket's status (IN_PROGRESS, RESOLVED, CLOSED, REJECTED). "
                + "ADMIN or TECHNICAL_STAFF only. Follows strict state transitions: "
                + "OPEN\u2192IN_PROGRESS\u2192RESOLVED\u2192CLOSED (or OPEN/IN_PROGRESS\u2192REJECTED). "
                + "Rejection needs a reason. Two-step confirmation.";
    }

    @Override public boolean isAvailableFor(User user) {
        return user.getRole() == Role.ADMIN || user.getRole() == Role.TECHNICAL_STAFF;
    }

    @Override public ObjectNode parametersSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        ObjectNode id = props.putObject("ticketId");
        id.put("type", "integer");
        ObjectNode status = props.putObject("status");
        status.put("type", "string");
        status.putArray("enum").add("IN_PROGRESS").add("RESOLVED").add("CLOSED").add("REJECTED");
        ObjectNode reason = props.putObject("rejectionReason");
        reason.put("type", "string");
        reason.put("description", "Required when status=REJECTED.");
        ObjectNode notes = props.putObject("resolutionNotes");
        notes.put("type", "string");
        ObjectNode confirmed = props.putObject("confirmed");
        confirmed.put("type", "boolean");
        schema.putArray("required").add("ticketId").add("status");
        return schema;
    }

    @Override public Object execute(ObjectNode arguments, User currentUser) {
        if (currentUser.getRole() != Role.ADMIN && currentUser.getRole() != Role.TECHNICAL_STAFF) {
            return Map.of("error", "forbidden",
                    "message", "Only admins and technicians can update ticket status.");
        }
        if (arguments == null) return Map.of("error", "missing_arguments");

        long ticketId = arguments.path("ticketId").asLong(0);
        String statusStr = arguments.path("status").asString("").trim().toUpperCase();
        if (ticketId <= 0 || statusStr.isEmpty()) {
            return Map.of("error", "missing_fields", "message", "ticketId and status are required.");
        }
        TicketStatus newStatus;
        try {
            newStatus = TicketStatus.valueOf(statusStr);
        } catch (IllegalArgumentException e) {
            return Map.of("error", "invalid_status", "message", e.getMessage());
        }

        String rejectionReason = arguments.path("rejectionReason").asString("");
        String resolutionNotes = arguments.path("resolutionNotes").asString("");
        if (newStatus == TicketStatus.REJECTED && rejectionReason.isBlank()) {
            return Map.of("error", "missing_reason",
                    "message", "rejectionReason is required when status=REJECTED.");
        }

        boolean confirmed = arguments.path("confirmed").asBoolean(false);
        if (!confirmed) {
            Map<String, Object> preview = new LinkedHashMap<>();
            preview.put("ticketId", ticketId);
            preview.put("newStatus", newStatus);
            if (!rejectionReason.isBlank()) preview.put("rejectionReason", rejectionReason);
            if (!resolutionNotes.isBlank()) preview.put("resolutionNotes", resolutionNotes);
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("confirmationRequired", true);
            out.put("preview", preview);
            out.put("instructions", "Confirm the status transition with the user, then call again with confirmed=true.");
            return out;
        }

        TicketStatusUpdateDTO dto = new TicketStatusUpdateDTO();
        dto.setStatus(newStatus);
        dto.setRejectionReason(rejectionReason.isBlank() ? null : rejectionReason);
        dto.setResolutionNotes(resolutionNotes.isBlank() ? null : resolutionNotes);

        try {
            TicketResponseDTO updated = ticketService.updateStatus(ticketId, dto, currentUser);
            return Map.of("success", true, "ticketId", updated.getId(),
                    "status", updated.getStatus(),
                    "message", "Ticket #" + updated.getId() + " is now " + updated.getStatus() + ".");
        } catch (Exception e) {
            return Map.of("success", false, "error", "update_failed", "message", e.getMessage());
        }
    }
}
