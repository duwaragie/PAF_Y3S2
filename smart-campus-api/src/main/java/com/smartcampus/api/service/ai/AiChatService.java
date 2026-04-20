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

import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@Slf4j
@Service
public class AiChatService {

    private final RestClient groqClient;
    private final RestClient openaiClient;
    private final AiProperties props;
    private final ToolRegistry toolRegistry;
    private final ObjectMapper mapper;

    public AiChatService(
            @Qualifier("groqRestClient") RestClient groqClient,
            @Qualifier("openaiRestClient") RestClient openaiClient,
            AiProperties props,
            ToolRegistry toolRegistry,
            ObjectMapper mapper) {
        this.groqClient = groqClient;
        this.openaiClient = openaiClient;
        this.props = props;
        this.toolRegistry = toolRegistry;
        this.mapper = mapper;
    }

    public ChatResponseDto chat(List<ChatMessageDto> history, User currentUser) {
        String apiKey = props.activeApiKey();
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    (props.isOpenAi() ? "OPENAI_API_KEY" : "GROQ_API_KEY") + " is not configured");
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
        boolean retriedToolUse = false;

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
            } catch (ToolUseFailedException tufe) {
                // Llama 3.3 occasionally emits text-mode <function=...> calls with stringified
                // args. One corrective nudge clears this up the vast majority of the time.
                if (!retriedToolUse) {
                    retriedToolUse = true;
                    log.info("Retrying after tool_use_failed");
                    ObjectNode nudge = mapper.createObjectNode();
                    nudge.put("role", "system");
                    nudge.put("content",
                            "Your previous tool call used the wrong argument types. "
                            + "Use native function calling with EXACT types from the schema \u2014 "
                            + "integers as numbers (not strings), booleans as true/false (not \"true\"). "
                            + "Never output <function=...> text.");
                    messages.add(nudge);
                    continue;
                }
                log.warn("tool_use_failed after retry: {}", tufe.getMessage());
                return new ChatResponseDto(
                        "I had trouble calling the right tool for that. Could you rephrase?",
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
                You are CampusBot for SLIIT Smart Campus Hub. \
                User: %s (role: %s, id: %s). Current date-time: %s (%s).

                Rules:
                - Always call tools for live data; never invent IDs, grades, or content.
                - Never decide a time is "in the past" yourself \u2014 always let the tool's response \
                tell you. Use the current date-time above for any reasoning, and TRUST the tool's verdict.
                - Format lists as a brief intro + bullets. No raw JSON.
                - Be warm and concise; use the user's first name occasionally.
                - If a user mentions a name ("Lab 304", "CS2030"), call a browse tool first to get its ID.
                - When you've already got IDs from an earlier browse/find/list call in this \
                conversation, reuse them for the next write tool call. Do NOT re-browse or ask \
                the user to re-specify what they just saw.
                - If a tool returns confirmationRequired=true: show the preview clearly, \
                warn about any flags (overCapacity, hasApprovedConflict, destructive action), \
                ask "Shall I go ahead?". On user yes, if the result included a `commitArgs` \
                object, your NEXT action must be a tool_call to the same tool using EXACTLY \
                those args (confirmed=true). Do not produce prose that re-describes the preview.
                - If a tool returns error=forbidden, explain politely which role is allowed.
                - If asked something outside your tools, say you focus on campus services.
                """
                .formatted(
                        currentUser.getName(),
                        currentUser.getRole(),
                        currentUser.getId(),
                        ZonedDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm")),
                        ZoneId.systemDefault());
        ObjectNode msg = mapper.createObjectNode();
        msg.put("role", "system");
        msg.put("content", prompt);
        return msg;
    }

    private JsonNode callGroq(ArrayNode messages, User currentUser) {
        RestClient client = props.isOpenAi() ? openaiClient : groqClient;
        String providerName = props.activeProviderName();

        ObjectNode body = mapper.createObjectNode();
        body.put("model", props.activeModel());
        body.set("messages", messages);
        body.set("tools", buildToolsArray(currentUser));
        body.put("tool_choice", "auto");
        body.put("temperature", 0.3);
        // Cap output reservation so Groq's TPM quota / OpenAI's per-request spend isn't burned on unused headroom.
        body.put("max_tokens", 512);

        try {
            String raw = client.post()
                    .uri("/chat/completions")
                    .header("Authorization", "Bearer " + props.activeApiKey())
                    .body(mapper.writeValueAsString(body))
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, (req, res) -> {
                        String errBody = new String(res.getBody().readAllBytes());
                        log.error("{} error {}: {}", providerName, res.getStatusCode(), errBody);
                        if (res.getStatusCode().value() == 429) {
                            Integer retryAfter = null;
                            String hdr = res.getHeaders().getFirst("retry-after");
                            if (hdr != null) {
                                try { retryAfter = (int) Math.ceil(Double.parseDouble(hdr)); }
                                catch (NumberFormatException ignored) { /* header absent or malformed */ }
                            }
                            throw new RateLimitException(retryAfter, errBody);
                        }
                        if (res.getStatusCode().value() == 400 && errBody.contains("tool_use_failed")) {
                            throw new ToolUseFailedException(errBody);
                        }
                        throw new IllegalStateException(
                                providerName + " API error " + res.getStatusCode() + ": " + errBody);
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
            ObjectNode schema = tool.parametersSchema().deepCopy();
            widenSchemaTypes(schema);
            ensureConfirmedRequired(schema);
            fn.set("parameters", schema);
            arr.add(entry);
        }
        return arr;
    }

    /**
     * Widens integer/number/boolean types to also accept string form. Some Groq models
     * (e.g. llama-4-scout) occasionally emit stringified args; accepting both lets Groq's
     * server-side schema validation pass, and our tools already coerce via Jackson's
     * asInt()/asLong()/asBoolean() which parse numeric strings.
     */
    private void widenSchemaTypes(JsonNode node) {
        if (node == null || !node.isObject()) return;
        ObjectNode obj = (ObjectNode) node;
        JsonNode type = obj.get("type");
        if (type != null && type.isString()) {
            String t = type.asString();
            if ("integer".equals(t) || "number".equals(t) || "boolean".equals(t)) {
                ArrayNode union = mapper.createArrayNode();
                union.add(t);
                union.add("string");
                obj.set("type", union);
            }
        }
        JsonNode props = obj.get("properties");
        if (props != null && props.isObject()) {
            for (var entry : props.properties()) {
                widenSchemaTypes(entry.getValue());
            }
        }
    }

    /**
     * If a tool exposes a `confirmed` parameter, force it into the required list so the LLM
     * must consciously pick true or false on every call. Prevents models from silently
     * re-calling with confirmed=false (default) after the user has said yes, which loops
     * the preview endlessly.
     */
    private void ensureConfirmedRequired(ObjectNode schema) {
        JsonNode props = schema.get("properties");
        if (props == null || !props.isObject() || props.get("confirmed") == null) return;
        JsonNode req = schema.get("required");
        ArrayNode required = (req instanceof ArrayNode) ? (ArrayNode) req : schema.putArray("required");
        for (JsonNode item : required) {
            if ("confirmed".equals(item.asString(""))) return;
        }
        required.add("confirmed");
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
