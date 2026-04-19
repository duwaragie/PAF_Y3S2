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

import java.util.Map;

@Component
@RequiredArgsConstructor
public class ApproveBookingTool implements AiTool {

    private final BookingService bookingService;
    private final ObjectMapper objectMapper;

    @Override public String name() { return "approve_booking"; }

    @Override public String description() {
        return "Approves a PENDING booking. ADMIN only. Auto-rejects any other pending bookings "
                + "overlapping the same slot. Two-step confirmation.";
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
        ObjectNode confirmed = props.putObject("confirmed");
        confirmed.put("type", "boolean");
        schema.putArray("required").add("bookingId");
        return schema;
    }

    @Override public Object execute(ObjectNode arguments, User currentUser) {
        if (currentUser.getRole() != Role.ADMIN) {
            return Map.of("error", "forbidden", "message", "Only admins can approve bookings.");
        }
        if (arguments == null) return Map.of("error", "missing_arguments");
        long bookingId = arguments.path("bookingId").asLong(0);
        if (bookingId <= 0) return Map.of("error", "missing_bookingId");

        boolean confirmed = arguments.path("confirmed").asBoolean(false);
        if (!confirmed) {
            return Map.of(
                    "confirmationRequired", true,
                    "preview", Map.of("bookingId", bookingId,
                            "action", "APPROVE",
                            "sideEffect", "Any overlapping PENDING bookings will be auto-rejected."),
                    "instructions", "Confirm with admin, then call again with confirmed=true.");
        }

        try {
            BookingDTO approved = bookingService.approveBooking(bookingId, currentUser.getId());
            return Map.of("success", true,
                    "bookingId", approved.getId(),
                    "status", approved.getStatus(),
                    "message", "Booking #" + approved.getId() + " approved.");
        } catch (Exception e) {
            return Map.of("success", false, "error", "approve_failed", "message", e.getMessage());
        }
    }
}
