package com.carenest.backend.dto.medication;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MedicationCatalogResponse {

    private Long id;
    private String name;
    private String brandNames;
    private String dosageForm;
    private String commonStrengths;
    private String category;
    private String atcCode;
    private String usageNote;
}
