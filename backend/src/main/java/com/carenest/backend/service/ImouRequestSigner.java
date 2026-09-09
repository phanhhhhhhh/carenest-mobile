package com.carenest.backend.service;

import org.springframework.stereotype.Component;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import java.util.HexFormat;

@Component
public class ImouRequestSigner {

    public String sign(long time, String nonce, String appSecret) {
        try {
            String password = HexFormat.of().formatHex(
                MessageDigest.getInstance("SHA-256")
                    .digest(appSecret.getBytes(StandardCharsets.UTF_8)));
            String source = "time:" + time + ",nonce:" + nonce + ",appSecret:" + appSecret;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(password.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getEncoder().encodeToString(
                mac.doFinal(source.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException | java.security.InvalidKeyException ex) {
            throw new IllegalStateException("Required IMOU signing algorithm is unavailable", ex);
        }
    }
}
