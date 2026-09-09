package com.carenest.backend.service;

import com.carenest.backend.dto.camera.ImouModels;
import com.carenest.backend.entity.CameraDevice;
import com.carenest.backend.entity.User;
import com.carenest.backend.exception.CameraLinkException;
import com.carenest.backend.exception.ImouApiException;
import com.carenest.backend.repository.CameraDeviceRepository;
import com.carenest.backend.repository.CameraSnapshotRepository;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.NotificationRepository;
import com.carenest.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.mock;

class CameraServiceTest {

    private final CameraDeviceRepository cameraRepository = mock(CameraDeviceRepository.class);
    private final CameraSnapshotRepository snapshotRepository = mock(CameraSnapshotRepository.class);
    private final ImouApiService imou = mock(ImouApiService.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final NotificationRepository notificationRepository = mock(NotificationRepository.class);
    private final FcmService fcmService = mock(FcmService.class);
    private final FamilyLinkRepository familyLinkRepository = mock(FamilyLinkRepository.class);
    private final CameraConsentService consentService = mock(CameraConsentService.class);
    private CameraService service;

    @BeforeEach
    void setUp() {
        service = new CameraService(
            cameraRepository,
            snapshotRepository,
            imou,
            userRepository,
            notificationRepository,
            fcmService,
            familyLinkRepository,
            consentService);
        when(userRepository.findById(10L)).thenReturn(Optional.of(User.builder().id(10L).build()));
        when(imou.getAccessToken()).thenReturn("At_token");
        when(imou.deviceOnline("ABC123", "At_token"))
            .thenReturn(new ImouModels.DeviceOnlineData("ABC123", "1", List.of()));
        when(imou.listDeviceAbility("ABC123", "At_token"))
            .thenReturn(new ImouModels.DeviceAbilityData(List.of(
                new ImouModels.AbilityDevice(
                    "ABC123", "WLAN,PT", List.of(
                        new ImouModels.AbilityChannel("0", "PT,AudioTalk")), List.of()))));
        when(cameraRepository.saveAndFlush(any(CameraDevice.class))).thenAnswer(invocation -> {
            CameraDevice camera = invocation.getArgument(0);
            camera.setId(99L);
            return camera;
        });
    }

    @Test
    void acceptedConsentUnboundDeviceIsBoundConfirmedAndSavedOnline() {
        when(imou.checkDeviceBinding("ABC123", "At_token"))
            .thenReturn(new ImouModels.BindingState(false, false))
            .thenReturn(new ImouModels.BindingState(true, true));

        CameraDevice result = service.bindCamera(10L, " abc123 ", " Living   room ", "SC1234");

        verify(consentService).requireConsent(10L);
        verify(imou).bindDevice("ABC123", "SC1234", "At_token");
        verify(imou, org.mockito.Mockito.times(2)).checkDeviceBinding("ABC123", "At_token");
        assertThat(result.getStatus()).isEqualTo(CameraDevice.CameraStatus.ONLINE);
        assertThat(result.getLabel()).isEqualTo("Living room");
        assertThat(result.getCapabilities()).isEqualTo("WLAN,PT,AudioTalk");
        assertThat(result.getLastSeenAt()).isNotNull();
    }

    @Test
    void absentOrDeclinedConsentStopsBeforeProviderCall() {
        doThrow(new CameraLinkException(
            "CAMERA_CONSENT_REQUIRED",
            org.springframework.http.HttpStatus.CONFLICT,
            "Consent required"))
            .when(consentService).requireConsent(10L);

        assertThatThrownBy(() -> service.bindCamera(10L, "ABC123", "Room", ""))
            .isInstanceOfSatisfying(CameraLinkException.class,
                ex -> assertThat(ex.getCode()).isEqualTo("CAMERA_CONSENT_REQUIRED"));
        verify(imou, never()).getAccessToken();
    }

    @Test
    void localDuplicateStopsBeforeProviderCall() {
        when(cameraRepository.existsByDeviceSn("ABC123")).thenReturn(true);

        assertThatThrownBy(() -> service.bindCamera(10L, "abc123", "Room", ""))
            .isInstanceOfSatisfying(CameraLinkException.class,
                ex -> assertThat(ex.getCode()).isEqualTo("CAMERA_ALREADY_LINKED"));
        verify(imou, never()).getAccessToken();
    }

    @Test
    void deviceAlreadyOwnedByDeveloperIsIdempotentAtProvider() {
        when(imou.checkDeviceBinding("ABC123", "At_token"))
            .thenReturn(new ImouModels.BindingState(true, true));

        service.bindCamera(10L, "ABC123", "Room", "");

        verify(imou, never()).bindDevice(any(), any(), any());
        verify(cameraRepository).saveAndFlush(any(CameraDevice.class));
    }

    @Test
    void alreadyOwnedBindRaceIsRecheckedAndHandledIdempotently() {
        when(imou.checkDeviceBinding("ABC123", "At_token"))
            .thenReturn(new ImouModels.BindingState(false, false))
            .thenReturn(new ImouModels.BindingState(true, true));
        doThrow(new ImouApiException(
            ImouApiException.Kind.ALREADY_OWNED, "DV1003", "already owned"))
            .when(imou).bindDevice("ABC123", "", "At_token");

        CameraDevice result = service.bindCamera(10L, "ABC123", "Room", "");

        assertThat(result.getId()).isEqualTo(99L);
        verify(imou, org.mockito.Mockito.times(2)).checkDeviceBinding("ABC123", "At_token");
    }

    @Test
    void deviceBoundToAnotherAccountIsRejected() {
        when(imou.checkDeviceBinding("ABC123", "At_token"))
            .thenReturn(new ImouModels.BindingState(true, false));

        assertThatThrownBy(() -> service.bindCamera(10L, "ABC123", "Room", ""))
            .isInstanceOfSatisfying(CameraLinkException.class,
                ex -> assertThat(ex.getCode()).isEqualTo("IMOU_BOUND_TO_ANOTHER_ACCOUNT"));
        verify(cameraRepository, never()).saveAndFlush(any());
    }

    @Test
    void providerBindFailureNeverPersists() {
        when(imou.checkDeviceBinding("ABC123", "At_token"))
            .thenReturn(new ImouModels.BindingState(false, false));
        doThrow(new ImouApiException(
            ImouApiException.Kind.INVALID_DEVICE_CODE, "DV1005", "rejected"))
            .when(imou).bindDevice("ABC123", "bad", "At_token");

        assertThatThrownBy(() -> service.bindCamera(10L, "ABC123", "Room", "bad"))
            .isInstanceOfSatisfying(CameraLinkException.class,
                ex -> assertThat(ex.getCode()).isEqualTo("IMOU_INVALID_DEVICE_CODE"));
        verify(cameraRepository, never()).saveAndFlush(any());
    }

    @Test
    void offlinePostBindStateIsPersistedOffline() {
        when(imou.checkDeviceBinding("ABC123", "At_token"))
            .thenReturn(new ImouModels.BindingState(true, true));
        when(imou.deviceOnline("ABC123", "At_token"))
            .thenReturn(new ImouModels.DeviceOnlineData("ABC123", "0", List.of()));

        CameraDevice result = service.bindCamera(10L, "ABC123", "Room", "");

        assertThat(result.getStatus()).isEqualTo(CameraDevice.CameraStatus.OFFLINE);
        assertThat(result.getLastSeenAt()).isNull();
    }

    @Test
    void providerStatusFailureNeverCreatesFalseOnlineState() {
        when(imou.checkDeviceBinding("ABC123", "At_token"))
            .thenReturn(new ImouModels.BindingState(true, true));
        when(imou.deviceOnline("ABC123", "At_token"))
            .thenThrow(new ImouApiException(
                ImouApiException.Kind.PROVIDER_UNAVAILABLE, "TRANSPORT_ERROR", "down"));

        assertThatThrownBy(() -> service.bindCamera(10L, "ABC123", "Room", ""))
            .isInstanceOfSatisfying(CameraLinkException.class,
                ex -> assertThat(ex.getCode()).isEqualTo("IMOU_UNAVAILABLE"));
        verify(cameraRepository, never()).saveAndFlush(any());
    }

    @Test
    void unsupportedAbilityQueryDoesNotBlockConfirmedBinding() {
        when(imou.checkDeviceBinding("ABC123", "At_token"))
            .thenReturn(new ImouModels.BindingState(true, true));
        when(imou.listDeviceAbility("ABC123", "At_token"))
            .thenThrow(new ImouApiException(
                ImouApiException.Kind.UNSUPPORTED_DEVICE, "DV1019", "unsupported"));

        CameraDevice result = service.bindCamera(10L, "ABC123", "Room", "");

        assertThat(result.getCapabilities()).isEmpty();
    }

    @Test
    void databaseConstraintMapsConcurrentDuplicateToStableError() {
        when(imou.checkDeviceBinding("ABC123", "At_token"))
            .thenReturn(new ImouModels.BindingState(true, true));
        when(cameraRepository.saveAndFlush(any(CameraDevice.class)))
            .thenThrow(new DataIntegrityViolationException("duplicate device_sn"));

        assertThatThrownBy(() -> service.bindCamera(10L, "ABC123", "Room", ""))
            .isInstanceOfSatisfying(CameraLinkException.class,
                ex -> assertThat(ex.getCode()).isEqualTo("CAMERA_ALREADY_LINKED"));
    }
}
