package com.smartcampus.api.service.ai.tools;

import com.smartcampus.api.dto.TicketRequestDTO;
import com.smartcampus.api.dto.TicketResponseDTO;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.TicketCategory;
import com.smartcampus.api.model.TicketPriority;
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
public class CreateTicketTool implements AiTool {

    private final TicketService ticketService;
    private final ObjectMapper objectMapper;

    @Override public String name() { return "create_ticket"; }

    @Override public String description() {
        return "Reports a maintenance / incident ticket. TWO-STEP: first call with confirmed=false to get "
                + "a preview, then ask the user to confirm, then call with confirmed=true. "
                + "Use for 'report a broken projector in Lab 304', 'flag an electrical issue'.";
    }

    @Override public boolean isAvailableFor(User user) {
        return user.getRole() == Role.STUDENT;
    }

    @Override public ObjectNode parametersSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");

        ObjectNode title = props.putObject("title");
        title.put("type", "string");
        title.put("description", "Short issue title (e.g. 'Projector not turning on').");

        ObjectNode location = props.putObject("location");
        location.put("type", "string");
        location.put("description", "Where the issue is (e.g. 'Lab 304', 'Main Building Room B12').");

        ObjectNode category = props.putObject("category");
        category.put("type", "string");
        category.putArray("enum")
                .add("ELECTRICAL").add("PLUMBING").add("IT_EQUIPMENT").add("FURNITURE")
                .add("HVAC").add("SAFETY").add("CLEANING").add("OTHER");

        ObjectNode description = props.putObject("description");
        description.put("type", "string");
        description.put("description", "Detailed description of the issue.");

        ObjectNode priority = props.putObject("priority");
        priority.put("type", "string");
        priority.putArray("enum").add("LOW").add("MEDIUM").add("HIGH").add("CRITICAL");

        ObjectNode email = props.putObject("preferredContactEmail");
        email.put("type", "string");

        ObjectNode phone = props.putObject("preferredContactPhone");
        phone.put("type", "string");

        ObjectNode confirmed = props.putObject("confirmed");
        confirmed.put("type", "boolean");
        confirmed.put("description", "Must be true to actually submit. Default false.");

        schema.putArray("required")
                .add("title").add("location").add("category").add("description").add("priority");
        return schema;
    }

    @Override public Object execute(ObjectNode arguments, User currentUser) {
        if (arguments == null) return Map.of("error", "missing_arguments");

        String title = arguments.path("title").asString("").trim();
        String location = arguments.path("location").asString("").trim();
        String description = arguments.path("description").asString("").trim();
        String categoryStr = arguments.path("category").asString("").trim();
        String priorityStr = arguments.path("priority").asString("").trim();

        if (title.isEmpty() || location.isEmpty() || description.isEmpty()
                || categoryStr.isEmpty() || priorityStr.isEmpty()) {
            return Map.of("error", "missing_fields",
                    "message", "title, location, category, description, and priority are all required.");
        }

        TicketCategory category;
        TicketPriority priority;
        try {
            category = TicketCategory.valueOf(categoryStr.toUpperCase());
            priority = TicketPriority.valueOf(priorityStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            return Map.of("error", "invalid_enum", "message", e.getMessage());
        }

        boolean confirmed = arguments.path("confirmed").asBoolean(false);

        if (!confirmed) {
            Map<String, Object> preview = new LinkedHashMap<>();
            preview.put("title", title);
            preview.put("location", location);
            preview.put("category", category);
            preview.put("priority", priority);
            preview.put("description", description);
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("confirmationRequired", true);
            result.put("preview", preview);
            result.put("instructions", "Show the preview, ask user to confirm, then call again with confirmed=true.");
            return result;
        }

        TicketRequestDTO req = new TicketRequestDTO();
        req.setTitle(title);
        req.setLocation(location);
        req.setCategory(category);
        req.setPriority(priority);
        req.setDescription(description);
        req.setPreferredContactEmail(arguments.path("preferredContactEmail").asString(null));
        req.setPreferredContactPhone(arguments.path("preferredContactPhone").asString(null));

        try {
            TicketResponseDTO created = ticketService.createTicket(req, currentUser);
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("success", true);
            out.put("ticketId", created.getId());
            out.put("status", created.getStatus());
            out.put("message", "Ticket #" + created.getId() + " created. Status: " + created.getStatus() + ".");
            return out;
        } catch (Exception e) {
            return Map.of("success", false, "error", "create_failed", "message", e.getMessage());
        }
    }
}
