package com.smartcampus.api.service.ai.tools;

import com.smartcampus.api.dto.TicketCommentRequestDTO;
import com.smartcampus.api.dto.TicketCommentResponseDTO;
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
public class AddTicketCommentTool implements AiTool {

    private final TicketService ticketService;
    private final ObjectMapper objectMapper;

    @Override public String name() { return "add_ticket_comment"; }

    @Override public String description() {
        return "Adds a comment to a ticket. Students can only comment on their own tickets; "
                + "admins/technicians can comment on any. Two-step confirmation.";
    }

    @Override public ObjectNode parametersSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        ObjectNode id = props.putObject("ticketId");
        id.put("type", "integer");
        ObjectNode content = props.putObject("content");
        content.put("type", "string");
        ObjectNode confirmed = props.putObject("confirmed");
        confirmed.put("type", "boolean");
        schema.putArray("required").add("ticketId").add("content");
        return schema;
    }

    @Override public Object execute(ObjectNode arguments, User currentUser) {
        if (arguments == null) return Map.of("error", "missing_arguments");
        long ticketId = arguments.path("ticketId").asLong(0);
        String content = arguments.path("content").asString("").trim();
        if (ticketId <= 0 || content.isEmpty()) {
            return Map.of("error", "missing_fields", "message", "ticketId and content are required.");
        }

        boolean confirmed = arguments.path("confirmed").asBoolean(false);
        if (!confirmed) {
            Map<String, Object> preview = new LinkedHashMap<>();
            preview.put("ticketId", ticketId);
            preview.put("content", content);
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("confirmationRequired", true);
            out.put("preview", preview);
            out.put("instructions", "Show the comment to the user, confirm, then call again with confirmed=true.");
            return out;
        }

        TicketCommentRequestDTO dto = new TicketCommentRequestDTO();
        dto.setContent(content);
        try {
            TicketCommentResponseDTO created = ticketService.addComment(ticketId, dto, currentUser);
            return Map.of("success", true,
                    "commentId", created.getId(),
                    "message", "Comment added to ticket #" + ticketId + ".");
        } catch (Exception e) {
            return Map.of("success", false, "error", "comment_failed", "message", e.getMessage());
        }
    }
}
