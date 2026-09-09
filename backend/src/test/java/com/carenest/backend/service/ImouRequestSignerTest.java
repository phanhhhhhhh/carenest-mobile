package com.carenest.backend.service;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class ImouRequestSignerTest {

    @Test
    void matchesOfficialStandardTestVector() {
        String sign = new ImouRequestSigner().sign(
            1706511734L,
            "f5a1ae2d-c09c-4d39-a744-83a5c2c653c2",
            "test123456789test123456789");

        assertThat(sign).isEqualTo("xjhCQBoJ9hRDsCjyDcHjtDNzRZ3ZJezcawsfWeiaoxU=");
    }
}
