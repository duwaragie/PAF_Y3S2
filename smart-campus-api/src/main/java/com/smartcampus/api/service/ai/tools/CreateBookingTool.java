package com.smartcampus.api.service.ai.tools;

import com.smartcampus.api.dto.BookingDTO;
import com.smartcampus.api.dto.CreateBookingRequest;
import com.smartcampus.api.dto.ResourceDTO;
import com.smartcampus.api.exception.BadRequestException;
import com.smartcampus.api.exception.ResourceNotFoundException;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.BookingRepository;
import com.smartcampus.api.service.BookingService;
import com.smartcampus.api.service.ResourceService;
import com.smartcampus.api.service.ai.AiTool;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@Component
@RequiredArgsConstructor
public class CreateBookingTool implements AiTool {

    private final BookingService bookingService;
    private final ResourceService resourceService;
    private final BookingRepository bookingRepository;
    private final ObjectMapper objectMapper;

    @Override
    public String name() {
        return "create_booking";
    }

    @Override
    public String description() {
        return "Creates a PENDING booking request for a facility. TWO-STEP: first call with confirmed=false "
                + "(or omitted) to get a preview \u2014 then show the preview to the user, ask for explicit "
                + "confirmation, and only call again with confirmed=true once the user says yes. "
                + "The server will refuse to create without confirmed=true.";
    }

    @Override public boolean isAvailableFor(User user) {
        return user.getRole() == Role.STUDENT;
    }

    @Override
    public ObjectNode parametersSchema() {
        ObjectNode schema = objectMapper.createObjectNode();
        schema.put("type", "object");
        ObjectNode props = schema.putObject("properties");

        ObjectNode resourceId = props.putObject("resourceId");
        resourceId.put("type", "integer");
        resourceId.put("description", "ID of the resource to book (get from find_free_facilities).");

        ObjectNode startTime = props.putObject("startTime");
        startTime.put("type", "string");
        startTime.put("description", "ISO datetime yyyy-MM-ddTHH:mm, e.g. 2026-04-21T10:00");

        ObjectNode endTime = props.putObject("endTime");
        endTime.put("type", "string");
        endTime.put("description", "ISO datetime yyyy-MM-ddTHH:mm, e.g. 2026-04-21T11:00");

        ObjectNode purpose = props.putObject("purpose");
        purpose.put("type", "string");
        purpose.put("description", "Why you're booking it (5\u2013500 chars).");

        ObjectNode attendees = props.putObject("expectedAttendees");
        attendees.put("type", "integer");
        attendees.put("description", "Optional expected attendee count.");

        ObjectNode confirmed = props.putObject("confirmed");
        confirmed.put("type", "boolean");
        confirmed.put("description", "Must be true to actually create. Default false \u2014 returns preview only.");

        schema.putArray("required")
                .add("resourceId").add("startTime").add("endTime").add("purpose");
        return schema;
    }

    @Override
    public Object execute(ObjectNode arguments, User currentUser) {
        if (arguments == null) {
            return Map.of("error", "missing_arguments");
        }

        Long resourceId = arguments.path("resourceId").asLong(0);
        if (resourceId <= 0) {
            return Map.of("error", "invalid_resourceId",
                    "message", "A valid resourceId is required. Use find_free_facilities to get one.");
        }

        LocalDateTime startDt;
        LocalDateTime endDt;
        try {
            startDt = LocalDateTime.parse(arguments.path("startTime").asString());
            endDt = LocalDateTime.parse(arguments.path("endTime").asString());
        } catch (RuntimeException e) {
            return Map.of("error", "invalid_datetime",
                    "message", "startTime and endTime must be in yyyy-MM-ddTHH:mm format.");
        }

        if (!endDt.isAfter(startDt)) {
            return Map.of("error", "invalid_window",
                    "message", "End time must be after start time.");
        }
        if (startDt.isBefore(LocalDateTime.now())) {
            return Map.of("error", "past_time",
                    "message", "Start time must be in the future.");
        }

        String purpose = arguments.path("purpose").asString("").trim();
        if (purpose.length() < 5 || purpose.length() > 500) {
            return Map.of("error", "invalid_purpose",
                    "message", "Purpose must be between 5 and 500 characters.");
        }

        Integer expectedAttendees = null;
        JsonNode attendeesNode = arguments.get("expectedAttendees");
        if (attendeesNode != null && attendeesNode.isIntegralNumber() && attendeesNode.asInt() > 0) {
            expectedAttendees = attendeesNode.asInt();
        }

        boolean confirmed = arguments.path("confirmed").asBoolean(false);

        // --- Preview path ---
        if (!confirmed) {
            ResourceDTO resource;
            try {
                resource = resourceService.getResourceById(resourceId);
            } catch (ResourceNotFoundException e) {
                return Map.of("error", "resource_not_found",
                        "message", "No resource with id " + resourceId + ".");
            }

            boolean hasConflict = !bookingRepository
                    .findConflictingBookings(resourceId, startDt, endDt).isEmpty();
            boolean overCapacity = resource.getCapacity() != null
                    && expectedAttendees != null
                    && expectedAttendees > resource.getCapacity();

            Map<String, Object> preview = new LinkedHashMap<>();
            preview.put("resourceId", resourceId);
            preview.put("resource", resource.getName());
            preview.put("location", resource.getLocationName());
            preview.put("capacity", resource.getCapacity());
            preview.put("startTime", startDt.toString());
            preview.put("endTime", endDt.toString());
            preview.put("durationMinutes", Duration.between(startDt, endDt).toMinutes());
            preview.put("purpose", purpose);
            preview.put("expectedAttendees", expectedAttendees);
            preview.put("status", "WOULD_CREATE_AS_PENDING");
            preview.put("hasApprovedConflict", hasConflict);
            preview.put("overCapacity", overCapacity);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("confirmationRequired", true);
            result.put("preview", preview);
            result.put("instructions",
                    "Show this preview to the user in clear natural language. Ask them to confirm "
                            + "with a clear yes. If any warning flags are true (hasApprovedConflict, "
                            + "overCapacity), highlight them. Only on explicit user confirmation, call "
                            + "create_booking again with the SAME arguments PLUS confirmed=true.");
            return result;
        }

        // --- Commit path ---
        CreateBookingRequest req = new CreateBookingRequest();
        req.setResourceId(resourceId);
        req.setStartTime(startDt);
        req.setEndTime(endDt);
        req.setPurpose(purpose);
        req.setExpectedAttendees(expectedAttendees);

        try {
            BookingDTO created = bookingService.createBooking(currentUser.getId(), req);
            Map<String, Object> out = new LinkedHashMap<>();
            out.put("success", true);
            out.put("bookingId", created.getId());
            out.put("status", created.getStatus());
            out.put("resource", created.getResourceName());
            out.put("location", created.getLocationName());
            out.put("startTime", created.getStartTime());
            out.put("endTime", created.getEndTime());
            out.put("message", "Booking request submitted. It's now PENDING admin approval.");
            return out;
        } catch (BadRequestException | ResourceNotFoundException e) {
            return Map.of(
                    "success", false,
                    "error", "booking_failed",
                    "message", e.getMessage());
        }
    }
}
