package com.krishiconnect.controller;

import com.google.firebase.FirebaseApp;
import com.krishiconnect.service.GeminiService;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/** GET /api/status - quick check that everything is wired up (no secrets). */
@RestController
public class StatusController {

    private final GeminiService gemini;

    public StatusController(GeminiService gemini) {
        this.gemini = gemini;
    }

    @GetMapping("/api/status")
    public Map<String, Object> status() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("ok", true);
        map.put("firebaseConfigured", !FirebaseApp.getApps().isEmpty());
        map.put("aiConfigured", gemini.isConfigured());
        return map;
    }
}
