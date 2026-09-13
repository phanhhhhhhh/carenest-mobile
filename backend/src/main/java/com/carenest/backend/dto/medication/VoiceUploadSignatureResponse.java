package com.carenest.backend.dto.medication;

import lombok.Builder;
import lombok.Getter;

/**
 * Everything the app needs to POST a signed upload straight to Cloudinary.
 * {@code apiKey} and {@code cloudName} are public identifiers — only the api
 * secret is confidential, and it never leaves the backend: it is folded into
 * {@code signature} instead.
 */
@Getter
@Builder
public class VoiceUploadSignatureResponse {

    private String signature;
    private long timestamp;
    private String folder;
    private String apiKey;
    private String cloudName;
}
