package com.krishiconnect.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.krishiconnect.dto.MandiRateDto;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.ArrayList;
import java.util.List;

@Service
public class MandiService {

    private static final String RESOURCE_ID =
            "9ef84268-d588-465a-a308-a864a43d0070";

    private static final String API_URL =
            "https://api.data.gov.in/resource/" + RESOURCE_ID;

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    @Value("${app.mandi.api-key:}")
    private String apiKey;

    public MandiService(ObjectMapper objectMapper) {
        this.restClient = RestClient.builder().build();
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
                    "Mandi API key is not configured."
            );
        }

        int safeLimit = Math.min(Math.max(limit, 1), 100);

        String response = restClient.get()
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
                                state
                        );
                    }

                    if (district != null && !district.isBlank()) {
                        uriBuilder.queryParam(
                                "filters[district]",
                                district
                        );
                    }

                    if (market != null && !market.isBlank()) {
                        uriBuilder.queryParam(
                                "filters[market]",
                                market
                        );
                    }

                    if (commodity != null && !commodity.isBlank()) {
                        uriBuilder.queryParam(
                                "filters[commodity]",
                                commodity
                        );
                    }

                    return uriBuilder.build();
                })
                .retrieve()
                .body(String.class);

        return parseResponse(response);
    }

    private List<MandiRateDto> parseResponse(String response) {

        try {

            JsonNode root =
                    objectMapper.readTree(response);

            JsonNode records =
                    root.path("records");

            List<MandiRateDto> result =
                    new ArrayList<>();

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

            throw new IllegalStateException(
                    "Unable to parse Mandi API response.",
                    e
            );
        }
    }

    private String text(
            JsonNode node,
            String field
    ) {

        JsonNode value = node.get(field);

        if (value == null || value.isNull()) {
            return "";
        }

        return value.asText();
    }
}
