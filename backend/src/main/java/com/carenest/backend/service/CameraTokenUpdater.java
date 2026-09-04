package com.carenest.backend.service;

import com.carenest.backend.entity.CameraDevice;
import com.carenest.backend.repository.CameraDeviceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class CameraTokenUpdater {

    private final CameraDeviceRepository cameraDeviceRepository;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateToken(Long cameraId, String accessToken, Instant refreshedAt) {
        CameraDevice camera = cameraDeviceRepository.findById(cameraId)
            .orElseThrow(() -> new IllegalStateException("Camera no longer exists"));
        camera.setAccessToken(accessToken);
        camera.setTokenRefreshedAt(refreshedAt);
        cameraDeviceRepository.saveAndFlush(camera);
    }
}
