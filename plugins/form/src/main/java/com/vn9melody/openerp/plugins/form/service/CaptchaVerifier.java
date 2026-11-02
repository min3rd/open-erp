package com.vn9melody.openerp.plugins.form.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/** Optional reCAPTCHA v3 verification for public fill (ADR-S08-003 §2.4). */
@ApplicationScoped
public class CaptchaVerifier {

    private static final Logger LOG = Logger.getLogger(CaptchaVerifier.class);
    private static final double MIN_SCORE = 0.5;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    @ConfigProperty(name = "form.captcha.recaptcha-secret", defaultValue = "")
    java.util.Optional<String> secret;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    /**
     * @return null when the form does not use captcha; otherwise an error code
     * when verification fails, or null when verification passed.
     */
    public String verify(String captchaMode, String captchaToken) {
        if (captchaMode == null || "none".equals(captchaMode)) {
            return null;
        }
        if ("recaptcha-v3".equals(captchaMode)) {
            if (secret == null || secret.isEmpty()) {
                LOG.debug("reCAPTCHA secret not configured; skipping verification (dev)");
                return null;
            }
            if (captchaToken == null || captchaToken.isBlank()) {
                return "FORM_PUBLIC_CAPTCHA_INVALID";
            }
            try {
                HttpRequest request = HttpRequest.newBuilder(URI.create(
                                "https://www.google.com/recaptcha/api/siteverify?secret="
                                        + secret.orElse("") + "&response=" + captchaToken))
                        .timeout(Duration.ofSeconds(5))
                        .POST(HttpRequest.BodyPublishers.noBody())
                        .build();
                HttpResponse<String> response = httpClient.send(request,
                        HttpResponse.BodyHandlers.ofString());
                JsonNode body = objectMapper.readTree(response.body());
                boolean success = body.path("success").asBoolean(false)
                        && body.path("score").asDouble(0) >= MIN_SCORE;
                return success ? null : "FORM_PUBLIC_CAPTCHA_INVALID";
            } catch (Exception e) {
                LOG.warnf("reCAPTCHA verification failed: %s", e.getMessage());
                return "FORM_PUBLIC_CAPTCHA_INVALID";
            }
        }
        return "FORM_PUBLIC_CAPTCHA_INVALID";
    }
}
