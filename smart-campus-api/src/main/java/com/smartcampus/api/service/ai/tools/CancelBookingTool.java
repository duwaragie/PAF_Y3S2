package com.smartcampus.api.service.ai.tools;

import com.smartcampus.api.dto.BookingDTO;
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
public class CancelBookingTool implements AiTool {

    private final BookingService bookingService;
    private final ObjectMapper objectMapper;

    @Override public String name() { return "cancel_booking"; }

    @Override public String description() {
        return "Cancels a booking. Owner or admin. PENDING can always be cancelled; APPROVED only "
                + "before start time. Two-step confirmation.";
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
        if (arguments == null) return Map.of("error", "missing_arguments");
        long bookingId = arguments.path("bookingId").asLong(0);
        if (bookingId <= 0) return Map.of("error", "missing_bookingId");

        boolean confirmed = arguments.path("confirmed").asBoolean(false);
        if (!confirmed) {
            return Map.of(
                    "confirmationRequired", true,
                    "preview", Map.of("bookingId", bookingId,
                            "action", "CANCEL BOOKING",
                            "note", "The slot will be released immediately."),
                    "instructions", "Confirm the cancellation with the user, then call again with confirmed=true.");
        }

        try {
            BookingDTO cancelled = bookingService.cancelBooking(bookingId, currentUser.getId());
            return Map.of("success", true,
                    "bookingId", cancelled.getId(),
                    "status", cancelled.getStatus(),
                    "message", "Booking #" + cancelled.getId() + " cancelled.");
        } catch (Exception e) {
            return Map.of("success", false, "error", "cancel_failed", "message", e.getMessage());
        }
    }
}
