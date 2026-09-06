package com.carenest.backend.service;

import com.carenest.backend.entity.CameraDevice;
import com.carenest.backend.repository.CameraDeviceRepository;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CameraTokenUpdaterTest {

    @Test
    void updateTokenPersistsTokenAndRefreshTimestamp() {
        CameraDeviceRepository repository = mock(CameraDeviceRepository.class);
        CameraTokenUpdater updater = new CameraTokenUpdater(repository);
        CameraDevice camera = CameraDevice.builder().id(10L).accessToken("old-token").build();
        Instant refreshedAt = Instant.parse("2026-09-06T09:00:00Z");
        when(repository.findById(10L)).thenReturn(Optional.of(camera));

        updater.updateToken(10L, "new-token", refreshedAt);

        assertThat(camera.getAccessToken()).isEqualTo("new-token");
        assertThat(camera.getTokenRefreshedAt()).isEqualTo(refreshedAt);
        verify(repository).saveAndFlush(camera);
    }
}
