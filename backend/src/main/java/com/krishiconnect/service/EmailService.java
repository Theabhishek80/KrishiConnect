package com.krishiconnect.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {
    private final JavaMailSender mailSender;
    private final String frontendUrl;
    private final String from;

    public EmailService(JavaMailSender mailSender,
                        @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl,
                        @Value("${app.mail-from:noreply@krishiconnect.local}") String from) {
        this.mailSender = mailSender;
        this.frontendUrl = frontendUrl;
        this.from = from;
    }

    public void sendPasswordReset(String email, String token) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject("Reset your KisanDirect password");
        message.setText("We received a request to reset your password.\n\n"
            + "Open this link within 30 minutes:\n"
            + frontendUrl.split(",")[0].trim() + "/reset-password?token=" + token
            + "\n\nIf you did not request this, you can ignore this email.");
        mailSender.send(message);
    }
}
