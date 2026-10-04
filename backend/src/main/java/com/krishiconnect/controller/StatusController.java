package com.krishiconnect.controller;

import com.google.firebase.FirebaseApp;
import com.krishiconnect.service.GeminiService;
import com.krishiconnect.service.ImageKitService;

import javax.sql.DataSource;
import java.sql.Connection;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * GET /api/status
 *
 * Safe deployment diagnostics. It never returns credentials or connection
 * strings. It checks whether the backend is alive and whether the configured
 * database connection can execute SELECT 1.
 */
@RestController
public class StatusController {

    private final GeminiService gemini;
    private final ImageKitService imageKit;
    private final DataSource dataSource;

    public StatusController(
            GeminiService gemini,
            ImageKitService imageKit,
            DataSource dataSource
    ) {
        this.gemini = gemini;
        this.imageKit = imageKit;
        this.dataSource = dataSource;
    }

    @GetMapping("/api/status")
    public Map<String, Object> status() {
        Map<String, Object> map = new LinkedHashMap<>();

        boolean databaseReachable = false;
        String databaseError = null;

        try (Connection connection = dataSource.getConnection()) {
            databaseReachable = connection.isValid(3);
        } catch (Exception e) {
            databaseError = e.getClass().getSimpleName();
        }

        map.put("ok", true);
        map.put("databaseReachable", databaseReachable);
        map.put("databaseError", databaseError);
        map.put("firebaseConfigured", !FirebaseApp.getApps().isEmpty());
        map.put("aiConfigured", gemini.isConfigured());
        map.put("imageKitConfigured", imageKit.isConfigured());

        return map;
    }
}
