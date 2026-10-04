package com.krishiconnect.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

/**
 * Initialises the Firebase Admin SDK (used to verify the Firebase ID tokens
 * the React app sends for e-mail and Google sign-in).
 *
 * Provide ONE of:
 *   FIREBASE_SERVICE_ACCOUNT_JSON  the full service-account JSON as text
 *   FIREBASE_SERVICE_ACCOUNT_FILE  path to the service-account .json file
 *
 * If neither is set the backend still starts (recipes, products, AI ... keep
 * working) but Firebase / Google sign-in cannot be verified, and a clear
 * message is logged. GET /api/status reports whether Firebase is ready.
 */
@Configuration
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${FIREBASE_SERVICE_ACCOUNT_JSON:}")
    private String serviceAccountJson;

    @Value("${FIREBASE_SERVICE_ACCOUNT_FILE:}")
    private String serviceAccountFile;

    @PostConstruct
    void init() {

        if (!FirebaseApp.getApps().isEmpty()) {
            return;
        }

        boolean hasJson = serviceAccountJson != null && !serviceAccountJson.isBlank();
        boolean hasFile = serviceAccountFile != null && !serviceAccountFile.isBlank();

        if (!hasJson && !hasFile) {
            log.error("""

                    ================================================================
                     FIREBASE IS NOT CONFIGURED
                     Login / Register / Google sign-in will NOT work until you set
                     FIREBASE_SERVICE_ACCOUNT_JSON (or FIREBASE_SERVICE_ACCOUNT_FILE).
                     Firebase console > Project settings > Service accounts >
                     Generate new private key.
                    ================================================================
                    """);
            return;
        }

        try (InputStream in = hasJson
                ? new ByteArrayInputStream(
                        serviceAccountJson.trim().getBytes(StandardCharsets.UTF_8))
                : new FileInputStream(serviceAccountFile.trim())) {

            FirebaseApp.initializeApp(
                    FirebaseOptions.builder()
                            .setCredentials(GoogleCredentials.fromStream(in))
                            .build()
            );

            log.info("Firebase Admin SDK initialised.");

        } catch (Exception e) {
            log.error("Firebase service account could not be read: {}. "
                    + "Check that the JSON is complete and valid.", e.getMessage());
        }
    }
}
