package com.carenest.backend.dto.medication;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Asks the backend to sign a Cloudinary upload of a reminder voice clip for one
 * elderly person. Only the elderly id is client-supplied — the upload folder is
 * chosen server-side so a caller can't write outside their own scope.
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoiceUploadSignatureRequest {

    @NotNull(message = "elderlyId is required")
    private Long elderlyId;
}
