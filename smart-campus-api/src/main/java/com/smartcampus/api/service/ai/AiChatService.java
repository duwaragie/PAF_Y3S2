package com.smartcampus.api.service.ai;

import com.smartcampus.api.config.AiProperties;
import com.smartcampus.api.dto.ai.ChatMessageDto;
import com.smartcampus.api.dto.ai.ChatResponseDto;
import com.smartcampus.api.model.User;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
public class AiChatService {

    private final RestClient groqClient;
    private final AiProperties props;
    private final ToolRegistry toolRegistry;
    private final ObjectMapper mapper;

    public AiChatService(
            @Qualifier("groqRestClient") RestClient groqClient,
            AiProperties props,
            ToolRegistry toolRegistry,
            ObjectMapper mapper) {
        this.groqClient = groqClient;
        this.props = props;
        this.toolRegistry = toolRegistry;
        this.mapper = mapper;
    }

    public ChatResponseDto chat(List<ChatMessageDto> history, User currentUser) {
        if (props.apiKey() == null || props.apiKey().isBlank()) {
            throw new IllegalStateException("GROQ_API_KEY is not configured");
        }

        ArrayNode messages = mapper.createArrayNode();
        messages.add(systemMessage(currentUser));
        for (ChatMessageDto m : history) {
            ObjectNode node = mapper.createObjectNode();
            node.put("role", m.role());
            node.put("content", m.content() == null ? "" : m.content());
            messages.add(node);
        }

        Set<String> toolsUsed = new LinkedHashSet<>();
        int maxIterations = props.maxToolIterations() == null ? 4 : props.maxToolIterations();

        for (int iteration = 0; iteration < maxIterations; iteration++) {
            JsonNode completion;
            try {
                completion = callGroq(messages, currentUser);
            } catch (RateLimitException rle) {
                String wait = rle.getRetryAfterSeconds() == null
                        ? "a few seconds"
                        : rle.getRetryAfterSeconds() + " second(s)";
                return new ChatResponseDto(
                        "I'm a bit overloaded right now \u2014 please try again in " + wait + ".",
                        new ArrayList<>(toolsUsed));
            } catch (RuntimeException e) {
                log.warn("AI chat failed: {}", e.getMessage());
                return new ChatResponseDto(
                        "Sorry \u2014 I ran into a hiccup processing that. Could you rephrase or try again?",
                        new ArrayList<>(toolsUsed));
            }
            JsonNode choice = completion.path("choices").path(0);
            JsonNode assistantMsg = choice.path("message");
            String finishReason = choice.path("finish_reason").asString("");

            JsonNode toolCalls = assistantMsg.path("tool_calls");
            if (toolCalls.isArray() && !toolCalls.isEmpty()) {
                messages.add(assistantMsg.deepCopy());
                for (JsonNode call : toolCalls) {
                    String callId = call.path("id").asString();
                    String fnName = call.path("function").path("name").asString();
                    String argsJson = call.path("function").path("arguments").asString("{}");
                    toolsUsed.add(fnName);
                    String toolResult = invokeTool(fnName, argsJson, currentUser);

                    ObjectNode toolMsg = mapper.createObjectNode();
                    toolMsg.put("role", "tool");
                    toolMsg.put("tool_call_id", callId);
                    toolMsg.put("name", fnName);
                    toolMsg.put("content", toolResult);
                    messages.add(toolMsg);
                }
                continue;
            }

            String reply = assistantMsg.path("content").asString("");
            log.debug("AI chat finished after {} iteration(s), finish_reason={}", iteration + 1, finishReason);
            return new ChatResponseDto(reply, new ArrayList<>(toolsUsed));
        }

        log.warn("AI chat hit max tool iterations ({}) without a final reply", maxIterations);
        return new ChatResponseDto(
                "Sorry \u2014 I couldn't finish that request. Try rephrasing?",
                new ArrayList<>(toolsUsed));
    }

    private ObjectNode systemMessage(User currentUser) {
        String prompt = """
                You are CampusBot, the friendly AI assistant for the Smart Campus Hub \
                at SLIIT. Students get full self-service; lecturers, admins, and staff \
                get read-only answers (they use the admin UI for changes).

                Capabilities available to everyone:
                  \u2022 facilities: browse, count, search, find free slots
                  \u2022 shuttle routes: browse active routes, origins and destinations
                  \u2022 bookings, tickets, notifications: view own records
                  \u2022 courses: browse catalogue, list sections, view enrollments, teaching load (lecturer)

                Student-only (write) capabilities:
                  \u2022 bookings: create, reschedule, cancel
                  \u2022 tickets: report, add/edit/delete own comments
                  \u2022 notifications: mark read, mark all read, delete
                  \u2022 enrollments: enroll, withdraw
                  \u2022 transcript: view GPA + credits

                The current user is: %s (role: %s, id: %s).
                Today is %s.

                Rules:
                - Always use the provided tools to read live data \u2014 never invent ticket numbers, \
                booking IDs, or notification content.
                - When a tool returns a list, format the reply as a short intro sentence followed \
                by a clean bullet list. Do not dump raw JSON.
                - Be concise and warm. Use the user's first name occasionally.
                - End list-style answers with a brief, relevant follow-up suggestion \
                (e.g. "Want details on any of these?").
                - If the user asks something outside your tools (e.g. "what's the weather"), \
                politely say you focus on campus services.
                - Grades: if a tool returns grade=null with gradeNote="Not yet released", \
                tell the user the grade hasn't been released yet \u2014 never guess or invent a grade.
                - Write operations are ALL two-step. When any tool returns \
                confirmationRequired=true: present the preview clearly in natural language \
                (never dump JSON), highlight any warnings (overCapacity, hasApprovedConflict, \
                destructive actions like deletes/withdrawals), and explicitly ask "Shall I go \
                ahead?". Only after an explicit user yes, call the SAME tool again with the SAME \
                arguments plus confirmed=true. Never confirm on the user's behalf.
                - Destructive actions (delete_*, withdraw_enrollment, mark_all_notifications_read, \
                cancel_booking) deserve an extra sentence of warning about consequences.
                - Lookups before writes: if the user gives a name (e.g. "Lab 304", "CS2030") rather \
                than an ID, first call a browse tool (browse_facilities, browse_course_offerings, \
                list_course_sections) to resolve the ID, then pass it to the write tool.
                - Tool responses with error="forbidden" mean the current user's role can't perform \
                that action. Explain politely which role IS allowed (message field has the detail).
                - Tools return role="STUDENT"/"LECTURER" or analogous hints \u2014 use them to frame \
                your reply for the user you're talking to.
                """
                .formatted(
                        currentUser.getName(),
                        currentUser.getRole(),
                        currentUser.getId(),
                        LocalDate.now());
        ObjectNode msg = mapper.createObjectNode();
        msg.put("role", "system");
        msg.put("content", prompt);
        return msg;
    }

    private JsonNode callGroq(ArrayNode messages, User currentUser) {
        ObjectNode body = mapper.createObjectNode();
        body.put("model", props.model());
        body.set("messages", messages);
        body.set("tools", buildToolsArray(currentUser));
        body.put("tool_choice", "auto");
        body.put("temperature", 0.3);
        // Cap the output reservation so Groq's TPM quota isn't burned on unused headroom.
        body.put("max_tokens", 1024);

        try {
            String raw = groqClient.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + props.apiKey())
                    .body(mapper.writeValueAsString(body))
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        String errBody = new String(res.getBody().readAllBytes());
                        log.error("Groq error {}: {}", res.getStatusCode(), errBody);
                        if (res.getStatusCode().value() == 429) {
                            Integer retryAfter = null;
                            String hdr = res.getHeaders().getFirst("retry-after");
                            if (hdr != null) {
                                try { retryAfter = (int) Math.ceil(Double.parseDouble(hdr)); }
                                catch (NumberFormatException ignored) { /* header absent or malformed */ }
                            }
                            throw new RateLimitException(retryAfter, errBody);
                        }
                        throw new IllegalStateException(
                                "Groq API error " + res.getStatusCode() + ": " + errBody);
                    })
                    .body(String.class);
            return mapper.readTree(raw);
        } catch (RuntimeException re) {
            throw re;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to call Groq: " + e.getMessage(), e);
        }
    }

    private ArrayNode buildToolsArray(User currentUser) {
        ArrayNode arr = mapper.createArrayNode();
        for (AiTool tool : toolRegistry.all()) {
            if (!tool.isAvailableFor(currentUser)) continue;
            ObjectNode entry = mapper.createObjectNode();
            entry.put("type", "function");
            ObjectNode fn = entry.putObject("function");
            fn.put("name", tool.name());
            fn.put("description", tool.description());
            fn.set("parameters", tool.parametersSchema());
            arr.add(entry);
        }
        return arr;
    }

    private String invokeTool(String fnName, String argsJson, User currentUser) {
        AiTool tool = toolRegistry.get(fnName);
        if (tool == null) {
            return errorJson("unknown_tool", "No tool named " + fnName);
        }
        try {
            ObjectNode args = mapper.createObjectNode();
            if (argsJson != null && !argsJson.isBlank()) {
                JsonNode parsed = mapper.readTree(argsJson);
                if (parsed.isObject()) {
                    args = (ObjectNode) parsed;
                }
            }
            Object result = tool.execute(args, currentUser);
            return mapper.writeValueAsString(result);
        } catch (Exception e) {
            log.warn("Tool {} failed: {}", fnName, e.getMessage());
            return errorJson("tool_failed", e.getMessage());
        }
    }

    private String errorJson(String code, String message) {
        ObjectNode err = mapper.createObjectNode();
        err.put("error", code);
        err.put("message", message == null ? "" : message);
        try {
            return mapper.writeValueAsString(err);
        } catch (Exception e) {
            return "{\"error\":\"" + code + "\"}";
        }
    }
}
