package com.krishiconnect.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.krishiconnect.dto.MandiRateDto;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.List;

@Service
public class MandiService {

    private static final Logger log =
            LoggerFactory.getLogger(MandiService.class);

    private static final String RESOURCE_ID =
            "9ef84268-d588-465a-a308-a864a43d0070";

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${app.mandi.api-key:}")
    private String apiKey;

    public MandiService(ObjectMapper objectMapper) {

        // Timeouts so a slow data.gov.in never hangs the request
        SimpleClientHttpRequestFactory factory =
                new SimpleClientHttpRequestFactory();

        factory.setConnectTimeout(10_000);
        factory.setReadTimeout(25_000);

        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .build();

        this.objectMapper = objectMapper;
    }

    public List<MandiRateDto> getRates(
            String state,
            String district,
            String market,
            String commodity,
            int limit
    ) {

        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException(
                    "Mandi API key is not configured. "
                            + "Set MANDI_API_KEY on the server."
            );
        }

        int safeLimit = Math.min(Math.max(limit, 1), 100);

        String response;

        try {

            response = restClient.get()
                    .uri(uriBuilder -> {

                        uriBuilder
                                .scheme("https")
                                .host("api.data.gov.in")
                                .path("/resource/" + RESOURCE_ID)
                                .queryParam("api-key", apiKey)
                                .queryParam("format", "json")
                                .queryParam("limit", safeLimit)
                                .queryParam("offset", 0);

                        if (state != null && !state.isBlank()) {
                            uriBuilder.queryParam(
                                    "filters[state]",
                                    state.trim()
                            );
                        }

                        if (district != null && !district.isBlank()) {
                            uriBuilder.queryParam(
                                    "filters[district]",
                                    district.trim()
                            );
                        }

                        if (market != null && !market.isBlank()) {
                            uriBuilder.queryParam(
                                    "filters[market]",
                                    market.trim()
                            );
                        }

                        if (commodity != null && !commodity.isBlank()) {
                            uriBuilder.queryParam(
                                    "filters[commodity]",
                                    commodity.trim()
                            );
                        }

                        return uriBuilder.build();
                    })
                    .retrieve()
                    .body(String.class);

        } catch (RestClientResponseException e) {

            // data.gov.in answered with an HTTP error (401/403/429/5xx...)
            log.error(
                    "data.gov.in returned HTTP {}: {}",
                    e.getStatusCode().value(),
                    e.getResponseBodyAsString()
            );

            int code = e.getStatusCode().value();

            if (code == 401 || code == 403) {
                throw new IllegalStateException(
                        "data.gov.in rejected the Mandi API key "
                                + "(HTTP " + code + "). "
                                + "Check MANDI_API_KEY on the server."
                );
            }

            if (code == 429) {
                throw new IllegalStateException(
                        "Mandi data service is busy (rate limit). "
                                + "Please try again in a minute."
                );
            }

            throw new IllegalStateException(
                    "Mandi data service returned HTTP " + code + "."
            );

        } catch (RestClientException e) {

            // timeout / DNS / connection problems
            log.error("Could not reach data.gov.in", e);

            throw new IllegalStateException(
                    "Could not reach the Mandi data service. "
                            + "Please try again."
            );
        }

        return parseResponse(response);
    }

    private List<MandiRateDto> parseResponse(String response) {

        try {

            JsonNode root = objectMapper.readTree(response);

            JsonNode records = root.path("records");

            List<MandiRateDto> result = new ArrayList<>();

            if (!records.isArray()) {
                return result;
            }

            for (JsonNode record : records) {

                result.add(
                        new MandiRateDto(
                                text(record, "state"),
                                text(record, "district"),
                                text(record, "market"),
                                text(record, "commodity"),
                                text(record, "variety"),
                                text(record, "grade"),
                                text(record, "arrival_date"),
                                text(record, "min_price"),
                                text(record, "max_price"),
                                text(record, "modal_price")
                        )
                );
            }

            return result;

        } catch (Exception e) {

            log.error("Unable to parse Mandi API response", e);

            throw new IllegalStateException(
                    "Unable to read the Mandi data response."
            );
        }
    }

    private String text(JsonNode node, String field) {

        JsonNode value = node.get(field);

        if (value == null || value.isNull()) {
            return "";
        }

        return value.asText();
    }
}
