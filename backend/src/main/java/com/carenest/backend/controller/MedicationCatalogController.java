package com.carenest.backend.controller;

import com.carenest.backend.dto.medication.MedicationCatalogResponse;
import com.carenest.backend.service.MedicationCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class MedicationCatalogController {

    private final MedicationCatalogService medicationCatalogService;

    @GetMapping("/api/medications/catalog")
    public ResponseEntity<List<MedicationCatalogResponse>> search(
        @RequestParam(name = "q", required = false, defaultValue = "") String query
    ) {
        return ResponseEntity.ok(medicationCatalogService.search(query));
    }
}
