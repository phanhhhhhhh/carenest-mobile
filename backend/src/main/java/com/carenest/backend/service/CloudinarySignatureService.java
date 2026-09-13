package com.carenest.backend.service;

import com.carenest.backend.dto.medication.VoiceUploadSignatureResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Map;
import java.util.TreeMap;

/**
 * Signs direct-to-Cloudinary uploads of medication reminder voice clips (UC B1).
 *
 * <p>The app used to upload with an unsigned preset whose name was bundled into
 * the APK, so anyone who unpacked a build could write arbitrary files into the
 * account indefinitely. The upload still goes device → Cloudinary (same network
 * path, the backend never proxies the audio), but Cloudinary now rejects it
 * unless it carries a signature only this service can produce.
 */
@Slf4j
@Service
public class CloudinarySignatureService {

    /** Voice clips live under a server-chosen folder, never one the client picks. */
    private static final String VOICE_FOLDER_PREFIX = "carenest/medication-voice/";

    @Value("${cloudinary.cloud-name}")
    private String cloudName;

    @Value("${cloudinary.api-key}")
    private String apiKey;

    @Value("${cloudinary.api-secret}")
    private String apiSecret;

    public VoiceUploadSignatureResponse signVoiceUpload(Long elderlyId) {
        if (apiSecret == null || apiSecret.isBlank()) {
            throw new IllegalStateException("Cloudinary is not configured for this deployment");
        }

        long timestamp = Instant.now().getEpochSecond();
        String folder = VOICE_FOLDER_PREFIX + elderlyId;

        Map<String, String> paramsToSign = new TreeMap<>();
        paramsToSign.put("folder", folder);
        paramsToSign.put("timestamp", String.valueOf(timestamp));

        return VoiceUploadSignatureResponse.builder()
            .signature(sign(paramsToSign))
            .timestamp(timestamp)
            .folder(folder)
            .apiKey(apiKey)
            .cloudName(cloudName)
            .build();
    }

    /**
     * Cloudinary's documented scheme: the params the client will send, sorted by
     * key as {@code key=value&key=value}, with the api secret appended, hashed
     * with SHA-1 and hex-encoded. The client must send exactly these params (plus
     * {@code api_key}, {@code signature} and the file) or the hash won't match.
     */
    private String sign(Map<String, String> paramsToSign) {
        StringBuilder toSign = new StringBuilder();
        for (Map.Entry<String, String> entry : paramsToSign.entrySet()) {
            if (toSign.length() > 0) {
                toSign.append("&");
            }
            toSign.append(entry.getKey()).append("=").append(entry.getValue());
        }
        toSign.append(apiSecret);

        try {
            MessageDigest sha1 = MessageDigest.getInstance("SHA-1");
            byte[] digest = sha1.digest(toSign.toString().getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(digest.length * 2);
            for (byte b : digest) {
                hex.append(String.format("%02x", b));
            }
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-1 is required for Cloudinary signatures", e);
        }
    }
}
