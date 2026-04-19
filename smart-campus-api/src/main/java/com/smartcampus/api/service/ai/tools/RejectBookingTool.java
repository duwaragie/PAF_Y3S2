package com.smartcampus.api.service.ai.tools;

import com.smartcampus.api.dto.BookingDTO;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.service.BookingService;
import com.smartcampus.api.service.ai.AiTool;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class RejectBookingTool implements AiTool {

    private final BookingService bookingService;
    private final ObjectMapper objectMapper;

    @Override public String name() { return "reject_booking"; }

    @Override public String description() {
        return "Rejects a PENDING booking with a reason. ADMIN only. Two-step confirmation.";
    }

    @Override public boolean isAvailableFor(User user) {
        return user.getRole() == Role.ADMIN;
    }

    @Override public ObjectNode parametersSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        ObjectNode id = props.putObject("bookingId");
        id.put("type", "integer");
        ObjectNode reason = props.putObject("rejectionReason");
        reason.put("type", "string");
        ObjectNode confirmed = props.putObject("confirmed");
        confirmed.put("type", "boolean");
        schema.putArray("required").add("bookingId").add("rejectionReason");
        return schema;
    }

    @Override public Object execute(ObjectNode arguments, User currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            return Map.of("error", "forbidden", "message", "Only admins can reject bookings.");
        }
        if (arguments == null) return Map.of("error", "missing_arguments");
        long bookingId = arguments.path("bookingId").asLong(0);
        String reason = arguments.path("rejectionReason").asString("").trim();
        if (bookingId <= 0 || reason.isEmpty()) {
            return Map.of("error", "missing_fields",
                    "message", "bookingId and rejectionReason are required.");
        }

        boolean confirmed = arguments.path("confirmed").asBoolean(false);
        if (!confirmed) {
            Map<String, Object> preview = new LinkedHashMap<>();
            preview.put("bookingId", bookingId);
            preview.put("action", "REJECT");
            preview.put("rejectionReason", reason);
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("confirmationRequired", true);
            out.put("preview", preview);
            out.put("instructions", "Confirm with admin, then call again with confirmed=true.");
            return out;
        }

        try {
            BookingDTO rejected = bookingService.rejectBooking(bookingId, currentUser.getId(), reason);
            return Map.of("success", true,
                    "bookingId", rejected.getId(),
                    "status", rejected.getStatus(),
                    "message", "Booking #" + rejected.getId() + " rejected.");
        } catch (Exception e) {
            return Map.of("success", false, "error", "reject_failed", "message", e.getMessage());
        }
    }
}
