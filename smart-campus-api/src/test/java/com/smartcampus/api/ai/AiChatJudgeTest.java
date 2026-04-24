package com.smartcampus.api.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcampus.api.model.AuthProvider;
import com.smartcampus.api.model.Role;
import com.smartcampus.api.model.User;
import com.smartcampus.api.repository.UserRepository;
import com.smartcampus.api.security.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * LLM-as-Judge evaluation of the CampusBot chat endpoint.
 *
 * <p>Each parameterised case fires a prompt at {@code POST /api/ai/chat}, then asks a
 * judge LLM (OpenAI gpt-4o-mini) whether the reply satisfies a rubric. The expected
 * tool is verified programmatically for hard regression signal; the judge verdict
 * covers qualitative aspects (hallucination, format, relevance).
 *
 * <p>Skipped locally unless {@code OPENAI_API_KEY} is set in the environment. CI wires
 * it from a repository secret.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@EnabledIfEnvironmentVariable(named = "OPENAI_API_KEY", matches = ".+")
class AiChatJudgeTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;
    @Autowired private JwtService jwtService;

    @MockitoBean private com.smartcampus.api.service.EmailService emailService;

    private final ObjectMapper mapper = new ObjectMapper();
    private LlmJudge judge;
    private String jwt;

    @BeforeEach
    void setUp() throws InterruptedException {
        // Groq free tier TPM (30K on scout) is tight for 10 sequential chat calls (~4.5K each).
        // Spacer stretches the run past 90s so tokens decay out of the rolling window in time.
        // OpenAI-backed runs just eat the delay as harmless cost.
        Thread.sleep(8_000);

        // Fresh student on every case so data state is predictable.
        userRepository.findByEmail("eval-student@test.local").ifPresent(userRepository::delete);
        User student = new User();
        student.setName("Eval Student");
        student.setEmail("eval-student@test.local");
        student.setPassword(passwordEncoder.encode("EvalPass1!"));
        student.setAuthProvider(AuthProvider.LOCAL);
        student.setEmailVerified(true);
        student.setRole(Role.STUDENT);
        student = userRepository.save(student);
        jwt = jwtService.generateToken(student);

        judge = new LlmJudge(System.getenv("OPENAI_API_KEY"));
    }

    /** One test case per row: user prompt, expected tool, rubric. */
    record Case(String name, String prompt, String expectedTool, String rubric) {}

    static Stream<Case> readCases() {
        return Stream.of(
                new Case("tickets_count",
                        "How many open tickets do I have?",
                        "get_my_tickets",
                        "Reply must state a specific ticket count (possibly zero). Must NOT invent ticket IDs or titles. Plain prose or a short list is fine."),

                new Case("notifications_list",
                        "What are my recent notifications?",
                        "get_my_notifications",
                        "Reply either lists notifications or clearly states none exist. Must NOT invent notification content."),

                new Case("bookings_overview",
                        "Show my bookings",
                        "get_my_bookings",
                        "Reply either lists bookings or clearly states none exist. Must NOT fabricate resource names or times."),

                new Case("courses_enrolled",
                        "What courses am I enrolled in?",
                        "get_my_courses",
                        "Reply either lists the student's enrollments or clearly states none. Must NOT invent course codes."),

                new Case("gpa_transcript",
                        "What's my GPA?",
                        "get_my_transcript",
                        "Reply either reports the student's GPA (possibly 0 if no released grades) or clearly explains no grades are released yet. Must NOT invent a GPA value."),

                new Case("catalogue_browse",
                        "What courses can I enroll in next semester?",
                        "browse_course_offerings",
                        "PASS if the reply EITHER (a) lists course offerings, OR (b) clearly " +
                        "says none are currently open for enrollment. An empty catalogue is a " +
                        "fully valid answer. Only FAIL if it invents course codes or ignores the question."),

                new Case("sections_list",
                        "What sections does offering 1 have?",
                        "list_course_sections",
                        "Reply either lists sections for offering 1 or clearly states none / offering-not-found. Must NOT fabricate lecturer names."),

                new Case("facilities_count",
                        "How many labs are on campus?",
                        "browse_facilities",
                        "PASS if the reply conveys how many labs exist in ANY form — an " +
                        "explicit number, OR equivalent phrasing like \"no labs\", \"none\", " +
                        "\"0 labs\", \"there aren't any labs\". These all count as stating zero. " +
                        "Only FAIL if it invents lab names or avoids the question."),

                new Case("shuttle_routes",
                        "What shuttle routes are available?",
                        "browse_shuttle_routes",
                        "Reply either lists shuttle routes (name / origin / destination) or states none. Must NOT invent routes."),

                new Case("find_free_facilities",
                        "Any meeting rooms free on 2026-05-10 from 14:00 to 15:00?",
                        "find_free_facilities",
                        "PASS if the reply addresses the availability question for the given " +
                        "window: either listing free meeting rooms, or clearly stating none " +
                        "are available. The reply may mention the date/time (in any format like " +
                        "\"May 10, 2026\", \"2026-05-10\", \"14:00 to 15:00\", \"2pm-3pm\") but " +
                        "this is optional. Only FAIL if the reply invents room names or ignores " +
                        "the time window entirely.")
        );
    }

    @ParameterizedTest(name = "[{index}] {0}")
    @MethodSource("readCases")
    @DisplayName("Read-only tools: tool call + LLM-judged quality")
    void evaluateReadCase(Case c) throws Exception {
        // 1. Send the prompt to our chat endpoint (with one retry on rate-limit messages)
        String requestBody = mapper.writeValueAsString(Map.of(
                "messages", List.of(Map.of("role", "user", "content", c.prompt))));

        JsonNode resp = postChat(requestBody);
        String reply = resp.path("reply").asText("");

        if (reply.contains("overloaded") || reply.toLowerCase().contains("try again in")) {
            // Groq TPM bucket hit during this iteration — wait for the window to clear, retry once.
            Thread.sleep(15_000);
            resp = postChat(requestBody);
            reply = resp.path("reply").asText("");
        }

        List<String> toolsUsed = new ArrayList<>();
        resp.path("toolsUsed").forEach(n -> toolsUsed.add(n.asText()));

        // 2. Hard check: expected tool must have been invoked
        assertTrue(toolsUsed.contains(c.expectedTool),
                "[" + c.name + "] expected tool '" + c.expectedTool + "' to be called, but got: " + toolsUsed
                        + "\nReply was: " + reply);

        // 3. Soft check: LLM judge verdict against rubric
        LlmJudge.Verdict verdict = judge.judge(c.prompt, reply, toolsUsed, c.rubric);
        assertTrue(verdict.pass(),
                "[" + c.name + "] judge failed: " + verdict.reasoning()
                        + "\nReply was: " + reply);
    }

    private JsonNode postChat(String requestBody) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/ai/chat")
                        .header("Authorization", "Bearer " + jwt)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andReturn();
        return mapper.readTree(result.getResponse().getContentAsString());
    }
}
