package com.smartcampus.api.service.ai.tools;

import com.smartcampus.api.dto.BookingDTO;
import com.smartcampus.api.dto.CreateBookingRequest;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.service.BookingService;
import com.smartcampus.api.service.ai.AiTool;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class UpdateBookingTool implements AiTool {

    private final BookingService bookingService;
    private final ObjectMapper objectMapper;

    @Override public String name() { return "update_booking"; }

    @Override public String description() {
        return "Reschedules a PENDING booking (owner or admin). Cannot edit APPROVED bookings \u2014 "
                + "cancel and rebook instead. Two-step confirmation.";
    }

    @Override public boolean isAvailableFor(User user) {
        return user.getRole() == Role.STUDENT;
    }

    @Override public ObjectNode parametersSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");
        ObjectNode id = props.putObject("bookingId");
        id.put("type", "integer");
        ObjectNode rid = props.putObject("resourceId");
        rid.put("type", "integer");
        ObjectNode st = props.putObject("startTime");
        st.put("type", "string");
        st.put("description", "ISO datetime yyyy-MM-ddTHH:mm");
        ObjectNode et = props.putObject("endTime");
        et.put("type", "string");
        ObjectNode p = props.putObject("purpose");
        p.put("type", "string");
        ObjectNode att = props.putObject("expectedAttendees");
        att.put("type", "integer");
        ObjectNode confirmed = props.putObject("confirmed");
        confirmed.put("type", "boolean");
        schema.putArray("required")
                .add("bookingId").add("resourceId").add("startTime").add("endTime").add("purpose");
        return schema;
    }

    @Override public Object execute(ObjectNode arguments, User currentUser) {
        if (arguments == null) return Map.of("error", "missing_arguments");
        long bookingId = arguments.path("bookingId").asLong(0);
        long resourceId = arguments.path("resourceId").asLong(0);
        String purpose = arguments.path("purpose").asString("").trim();
        if (bookingId <= 0 || resourceId <= 0 || purpose.isEmpty()) {
            return Map.of("error", "missing_fields");
        }
        LocalDateTime startDt, endDt;
        try {
            startDt = LocalDateTime.parse(arguments.path("startTime").asString());
            endDt = LocalDateTime.parse(arguments.path("endTime").asString());
        } catch (RuntimeException e) {
            return Map.of("error", "invalid_datetime",
                    "message", "startTime and endTime must be yyyy-MM-ddTHH:mm.");
        }
        if (!endDt.isAfter(startDt)) {
            return Map.of("error", "invalid_window", "message", "End time must be after start time.");
        }
        Integer attendees = null;
        JsonNode a = arguments.get("expectedAttendees");
        if (a != null && a.isIntegralNumber() && a.asInt() > 0) attendees = a.asInt();

        boolean confirmed = arguments.path("confirmed").asBoolean(false);
        if (!confirmed) {
            Map<String, Object> preview = new LinkedHashMap<>();
            preview.put("bookingId", bookingId);
            preview.put("resourceId", resourceId);
            preview.put("startTime", startDt.toString());
            preview.put("endTime", endDt.toString());
            preview.put("purpose", purpose);
            preview.put("expectedAttendees", attendees);
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("confirmationRequired", true);
            out.put("preview", preview);
            out.put("instructions", "Show the new times to the user, confirm, then call again with confirmed=true.");
            return out;
        }

        CreateBookingRequest req = new CreateBookingRequest();
        req.setResourceId(resourceId);
        req.setStartTime(startDt);
        req.setEndTime(endDt);
        req.setPurpose(purpose);
        req.setExpectedAttendees(attendees);
        try {
            BookingDTO updated = bookingService.updateBooking(bookingId, currentUser.getId(), req);
            return Map.of("success", true, "bookingId", updated.getId(),
                    "status", updated.getStatus(),
                    "message", "Booking #" + updated.getId() + " rescheduled.");
        } catch (Exception e) {
            return Map.of("success", false, "error", "update_failed", "message", e.getMessage());
        }
    }
}
