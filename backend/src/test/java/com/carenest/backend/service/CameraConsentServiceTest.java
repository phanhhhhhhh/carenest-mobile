package com.carenest.backend.service;

import com.carenest.backend.entity.CameraConsentStatus;
import com.carenest.backend.entity.ElderlyProfile;
import com.carenest.backend.entity.User;
import com.carenest.backend.exception.CameraLinkException;
import com.carenest.backend.repository.CameraDeviceRepository;
import com.carenest.backend.repository.ElderlyProfileRepository;
import com.carenest.backend.repository.FamilyLinkRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CameraConsentServiceTest {

    private final ElderlyProfileRepository profileRepository = mock(ElderlyProfileRepository.class);
    private CameraConsentService service;

    @BeforeEach
    void setUp() {
        service = new CameraConsentService(
            profileRepository,
            mock(CameraDeviceRepository.class),
            mock(FamilyLinkRepository.class),
            mock(FcmService.class),
            mock(NotificationService.class));
    }

    @Test
    void acceptedConsentAllowsD2() {
        when(profileRepository.findByUserIdAndDeletedAtIsNull(10L))
            .thenReturn(Optional.of(profile(CameraConsentStatus.ACCEPTED)));

        assertThatCode(() -> service.requireConsent(10L)).doesNotThrowAnyException();
    }

    @Test
    void absentConsentReturnsStableD2Error() {
        when(profileRepository.findByUserIdAndDeletedAtIsNull(10L)).thenReturn(Optional.empty());

        assertConsentRequired();
    }

    @Test
    void declinedConsentReturnsStableD2Error() {
        when(profileRepository.findByUserIdAndDeletedAtIsNull(10L))
            .thenReturn(Optional.of(profile(CameraConsentStatus.DECLINED)));

        assertConsentRequired();
    }

    private void assertConsentRequired() {
        assertThatThrownBy(() -> service.requireConsent(10L))
            .isInstanceOfSatisfying(CameraLinkException.class, ex -> {
                assertThat(ex.getCode()).isEqualTo("CAMERA_CONSENT_REQUIRED");
                assertThat(ex.getStatus().value()).isEqualTo(409);
            });
    }

    private ElderlyProfile profile(CameraConsentStatus status) {
        return ElderlyProfile.builder()
            .user(User.builder().id(10L).build())
            .cameraConsentStatus(status)
            .build();
    }
}
