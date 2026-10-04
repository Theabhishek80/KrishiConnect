package com.krishiconnect.controller;

import com.krishiconnect.service.GeminiService;
import com.krishiconnect.service.GeminiService.AiException;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * POST /api/ai/chat
 *   body:     { "messages": [ { "role": "user|assistant", "content": "..." } ] }
 *   response: { "reply": "..." }
 *
 * Requires a signed-in user so the Gemini quota cannot be used anonymously.
 */
@RestController
@RequestMapping("/api/ai")
@PreAuthorize("isAuthenticated()")
public class AiController {

    private final GeminiService gemini;

    public AiController(GeminiService gemini) {
        this.gemini = gemini;
    }

    @PostMapping("/chat")
    public ResponseEntity<Map<String, Object>> chat(
            @RequestBody Map<String, List<Map<String, String>>> request
    ) {
        List<Map<String, String>> messages = request.get("messages");

        if (messages == null || messages.isEmpty()) {
            throw new IllegalArgumentException("messages are required.");
        }

        try {
            String reply = gemini.chat(messages);
            return ResponseEntity.ok(Map.of("reply", reply));

        } catch (AiException e) {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("error", e.getMessage());
            body.put("code", e.code());

            // A retired model must not look like "endpoint not found" to the app.
            int status = e.status() == 404 ? 502 : e.status();

            return ResponseEntity.status(status).body(body);
        }
    }
}
