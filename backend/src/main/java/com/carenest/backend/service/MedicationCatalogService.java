package com.carenest.backend.service;

import com.carenest.backend.dto.medication.MedicationCatalogResponse;
import com.carenest.backend.entity.MedicationCatalogItem;
import com.carenest.backend.repository.MedicationCatalogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MedicationCatalogService {

    private static final int SEARCH_LIMIT = 20;

    private final MedicationCatalogRepository medicationCatalogRepository;

    public List<MedicationCatalogResponse> search(String query) {
        if (query == null || query.isBlank()) {
            return List.of();
        }
        return medicationCatalogRepository.search(query.trim(), PageRequest.of(0, SEARCH_LIMIT))
            .stream()
            .map(this::toResponse)
            .toList();
    }

    private MedicationCatalogResponse toResponse(MedicationCatalogItem item) {
        return MedicationCatalogResponse.builder()
            .id(item.getId())
            .name(item.getName())
            .brandNames(item.getBrandNames())
            .dosageForm(item.getDosageForm())
            .commonStrengths(item.getCommonStrengths())
            .category(item.getCategory())
            .atcCode(item.getAtcCode())
            .usageNote(item.getUsageNote())
            .build();
    }
}
