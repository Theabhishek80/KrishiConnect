package com.krishiconnect.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.ByteArrayInputStream;
import java.nio.charset.StandardCharsets;

@Configuration
public class FirebaseConfig {

    @Value("${FIREBASE_SERVICE_ACCOUNT_JSON}")
    private String firebaseServiceAccountJson;

    @Bean
    public FirebaseApp firebaseApp() throws Exception {

        if (FirebaseApp.getApps().isEmpty()) {
            FirebaseOptions options = FirebaseOptions.builder()
                    .setCredentials(
                            GoogleCredentials.fromStream(
                                    new ByteArrayInputStream(
                                            firebaseServiceAccountJson
                                                    .getBytes(StandardCharsets.UTF_8)
                                    )
                            )
                    )
                    .build();

            return FirebaseApp.initializeApp(options);
        }

        return FirebaseApp.getInstance();
    }
}
