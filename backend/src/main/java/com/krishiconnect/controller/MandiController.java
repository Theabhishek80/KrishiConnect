package com.krishiconnect.controller;

import com.krishiconnect.dto.MandiRateDto;
import com.krishiconnect.service.MandiService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/mandi")
public class MandiController {

    private final MandiService mandiService;

    public MandiController(MandiService mandiService) {
        this.mandiService = mandiService;
    }

    @GetMapping("/rates")
    public List<MandiRateDto> getRates(

            @RequestParam(required = false)
            String state,

            @RequestParam(required = false)
            String district,

            @RequestParam(required = false)
            String market,

            @RequestParam(required = false)
            String commodity,

            @RequestParam(defaultValue = "50")
            int limit

    ) {
        return mandiService.getRates(
                state,
                district,
                market,
                commodity,
                limit
        );
    }
}
