package com.krishiconnect.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Calls the Google Gemini API. The API key lives ONLY on the server
 * (GEMINI_API_KEY) - it is never sent to the browser.
 */
@Service
public class GeminiService {

    /** Thrown for any problem the controller should turn into an HTTP error. */
    public static class AiException extends RuntimeException {
        private final int status;
        private final String code;

        public AiException(int status, String code, String message) {
            super(message);
            this.status = status;
            this.code = code;
        }

        public int status() { return status; }
        public String code() { return code; }
    }

    private static final Logger log = LoggerFactory.getLogger(GeminiService.class);

    private static final String ENDPOINT =
            "https://generativelanguage.googleapis.com/v1beta/models/";

    private static final int MAX_TURNS = 20;
    private static final int MAX_CHARS_PER_MESSAGE = 4000;

    private static final String SYSTEM_PROMPT = """
            You are KisanDirect AI, a friendly agriculture assistant inside the \
            KrishiConnect farm-to-home marketplace in India.

            Help farmers and consumers with: crop selection and sowing times, soil \
            health, irrigation, fertiliser, pest and disease management (prefer low-cost \
            and organic methods first), post-harvest storage, getting better prices for \
            produce, Indian government schemes for farmers, and cooking with fresh produce.

            Rules:
            - Answer in the same language the user writes in (English, Hindi, Hinglish, etc.).
            - Be practical, concrete and concise. Short paragraphs or simple numbered steps.
            - Write plain text only. Do NOT use markdown symbols such as ** or # or backticks.
            - You do NOT have live data. Never invent today's mandi prices, weather or \
            scheme deadlines. For those, say you cannot see live data and suggest the \
            local mandi / Agmarknet, IMD / Meghdoot app, or the official scheme website.
            - For chemical pesticide doses, give general guidance only and tell the user to \
            follow the product label and check with the local Krishi Vigyan Kendra (KVK) \
            or agriculture officer.
            - For medical or legal questions, give brief general information and suggest a \
            qualified professional.
            - If a question is unrelated to farming, food or the marketplace, politely steer \
            back to those topics.
            """;

    private final ObjectMapper mapper;
    private final HttpClient http;
    private final String apiKey;
    private final List<String> models;

    // The model that last worked; tried first next time.
    private volatile String preferredModel;

    public GeminiService(
            ObjectMapper mapper,
            @Value("${app.gemini.api-key:}") String apiKey,
            @Value("${app.gemini.model:gemini-flash-latest}") String model,
            @Value("${app.gemini.fallback-models:gemini-3.8-flash,gemini-3.5-flash}") String fallbacks
    ) {
        this.mapper = mapper;
        this.apiKey = apiKey == null ? "" : apiKey.trim();

        Set<String> list = new LinkedHashSet<>();
        if (model != null && !model.isBlank()) list.add(model.trim());
        if (fallbacks != null) {
            for (String m : fallbacks.split(",")) {
                if (!m.isBlank()) list.add(m.trim());
            }
        }
        this.models = new ArrayList<>(list);

        this.http = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .build();
    }

    public boolean isConfigured() {
        return !apiKey.isBlank();
    }

    /**
     * @param messages chat history, each {"role": "user"|"assistant", "content": "..."}
     * @return the assistant's reply text
     */
    public String chat(List<Map<String, String>> messages) {

        if (!isConfigured()) {
            throw new AiException(503, "AI_NOT_CONFIGURED",
                    "KisanDirect AI is not configured yet.");
        }

        ObjectNode body = buildBody(messages);

        List<String> order = new ArrayList<>();
        if (preferredModel != null) order.add(preferredModel);
        for (String m : models) {
            if (!order.contains(m)) order.add(m);
        }

        AiException last = null;

        for (String model : order) {
            try {
                String reply = call(model, body);
                preferredModel = model;
                return reply;

            } catch (AiException e) {
                last = e;

                // Model retired / not available to this project -> try the next one.
                if (e.status() == 404 || "MODEL_UNAVAILABLE".equals(e.code())) {
                    log.warn("Gemini model '{}' is unavailable, trying next.", model);
                    continue;
                }
                throw e;
            }
        }

        throw last != null
                ? last
                : new AiException(502, "AI_ERROR", "No Gemini model is available.");
    }

    // ------------------------------------------------------------------

    private ObjectNode buildBody(List<Map<String, String>> messages) {

        ObjectNode root = mapper.createObjectNode();

        // System instruction
        ObjectNode system = root.putObject("systemInstruction");
        system.putArray("parts").addObject().put("text", SYSTEM_PROMPT);

        // Keep only the most recent turns
        List<Map<String, String>> recent = messages.size() > MAX_TURNS
                ? messages.subList(messages.size() - MAX_TURNS, messages.size())
                : messages;

        ArrayNode contents = root.putArray("contents");

        for (Map<String, String> m : recent) {
            String content = m.get("content");
            if (content == null || content.isBlank()) continue;

            String role = "assistant".equalsIgnoreCase(m.get("role")) ? "model" : "user";

            // Gemini requires the conversation to start with a user turn.
            if (contents.isEmpty() && role.equals("model")) continue;

            if (content.length() > MAX_CHARS_PER_MESSAGE) {
                content = content.substring(0, MAX_CHARS_PER_MESSAGE);
            }

            ObjectNode turn = contents.addObject();
            turn.put("role", role);
            turn.putArray("parts").addObject().put("text", content);
        }

        if (contents.isEmpty()) {
            throw new IllegalArgumentException("Please type a message.");
        }

        // NOTE: temperature / top_p / top_k are deprecated for the newest Gemini
        // models, so no sampling parameters are sent.
        root.putObject("generationConfig").put("maxOutputTokens", 2048);

        return root;
    }

    private String call(String model, ObjectNode body) {

        HttpResponse<String> response;

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(ENDPOINT + model + ":generateContent"))
                    .timeout(Duration.ofSeconds(60))
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(
                            mapper.writeValueAsString(body)))
                    .build();

            response = http.send(request, HttpResponse.BodyHandlers.ofString());

        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new AiException(502, "AI_ERROR", "The AI request was interrupted.");
        } catch (Exception e) {
            log.error("Gemini request failed: {}", e.toString());
            throw new AiException(502, "AI_ERROR",
                    "Could not reach the AI service. Please try again.");
        }

        int status = response.statusCode();

        if (status >= 200 && status < 300) {
            return extractText(response.body());
        }

        String detail = errorMessage(response.body());
        log.warn("Gemini returned HTTP {} for model {}: {}", status, model, detail);

        switch (status) {
            case 400:
                if (detail.toLowerCase().contains("api key")) {
                    throw new AiException(503, "AI_NOT_CONFIGURED",
                            "The Gemini API key is invalid. Check GEMINI_API_KEY.");
                }
                throw new AiException(400, "AI_BAD_REQUEST",
                        "The AI could not process that request.");
            case 401:
            case 403:
                throw new AiException(503, "AI_NOT_CONFIGURED",
                        "The Gemini API key was rejected. Check that the key is valid, "
                                + "the Generative Language API is enabled and the key has "
                                + "no restriction blocking this server.");
            case 404:
                throw new AiException(404, "MODEL_UNAVAILABLE",
                        "Model " + model + " is not available.");
            case 429:
                throw new AiException(429, "AI_RATE_LIMIT",
                        "KisanDirect AI is busy right now. Please try again in a minute.");
            default:
                throw new AiException(502, "AI_ERROR",
                        "The AI service had a problem. Please try again.");
        }
    }

    private String extractText(String json) {
        try {
            JsonNode root = mapper.readTree(json);

            JsonNode block = root.path("promptFeedback").path("blockReason");
            if (!block.isMissingNode() && !block.isNull()) {
                return "Sorry, I can't help with that request.";
            }

            StringBuilder text = new StringBuilder();

            for (JsonNode part : root.path("candidates").path(0).path("content").path("parts")) {
                // Skip "thought" parts if the model returns them.
                if (part.path("thought").asBoolean(false)) continue;
                JsonNode t = part.get("text");
                if (t != null && !t.isNull()) text.append(t.asText());
            }

            String result = text.toString().trim();

            if (result.isEmpty()) {
                throw new AiException(502, "AI_EMPTY",
                        "The assistant returned an empty answer. Please rephrase and try again.");
            }

            return result;

        } catch (AiException e) {
            throw e;
        } catch (Exception e) {
            throw new AiException(502, "AI_ERROR", "Could not read the AI response.");
        }
    }

    private String errorMessage(String json) {
        try {
            return mapper.readTree(json).path("error").path("message").asText("");
        } catch (Exception e) {
            return "";
        }
    }
}
