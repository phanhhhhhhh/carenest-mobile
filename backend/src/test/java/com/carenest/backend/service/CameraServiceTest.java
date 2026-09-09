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
import java.time.Instant;

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

    @Test
    void activeFamilyGetsFreshOnlineCheckAndSupportedHttpsHlsStream() {
        CameraDevice camera = liveCamera();
        when(cameraRepository.findById(42L)).thenReturn(Optional.of(camera));
        when(familyLinkRepository.existsByElderlyIdAndFamilyIdAndStatusAndDeletedAtIsNull(
            10L, 7L, com.carenest.backend.entity.FamilyLinkStatus.ACTIVE)).thenReturn(true);
        when(consentService.hasConsent(10L)).thenReturn(true);
        when(imou.deviceOnline("ABC123", "At_token"))
            .thenReturn(new ImouModels.DeviceOnlineData("ABC123", "1", List.of()));
        when(imou.getLiveStreamInfo("ABC123", "At_token"))
            .thenReturn(new ImouModels.LiveStreamData(List.of(
                new ImouModels.LiveStream("http://video/live.m3u8", 0, "0", "secret"),
                new ImouModels.LiveStream("https://video/live.m3u8?proto=https", 1, "0", "secret"))));

        var result = service.getLiveStream(42L, 7L);

        assertThat(result.cameraId()).isEqualTo(42L);
        assertThat(result.label()).isEqualTo("Living room");
        assertThat(result.playbackProtocol()).isEqualTo("HLS");
        assertThat(result.streamUrl()).startsWith("https://");
        verify(imou).deviceOnline("ABC123", "At_token");
        verify(imou).getLiveStreamInfo("ABC123", "At_token");
        assertThat(camera.getLastSeenAt()).isNotNull();
    }

    @Test
    void missingCameraIsNotFound() {
        when(cameraRepository.findById(42L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.getLiveStream(42L, 7L))
            .isInstanceOf(com.carenest.backend.exception.NotFoundException.class);
    }

    @Test
    void inactiveOrUnauthorizedFamilyIsRejectedBeforeConsentAndProvider() {
        when(cameraRepository.findById(42L)).thenReturn(Optional.of(liveCamera()));
        assertThatThrownBy(() -> service.getLiveStream(42L, 7L))
            .isInstanceOfSatisfying(CameraLinkException.class,
                ex -> assertThat(ex.getCode()).isEqualTo("CAMERA_ACCESS_DENIED"));
        verify(consentService, never()).hasConsent(any());
        verify(imou, never()).deviceOnline(any(), any());
    }

    @Test
    void missingOrDeclinedConsentIsRejectedBeforeProvider() {
        when(cameraRepository.findById(42L)).thenReturn(Optional.of(liveCamera()));
        when(familyLinkRepository.existsByElderlyIdAndFamilyIdAndStatusAndDeletedAtIsNull(
            10L, 7L, com.carenest.backend.entity.FamilyLinkStatus.ACTIVE)).thenReturn(true);
        when(consentService.hasConsent(10L)).thenReturn(false);
        assertThatThrownBy(() -> service.getLiveStream(42L, 7L))
            .isInstanceOfSatisfying(CameraLinkException.class,
                ex -> assertThat(ex.getCode()).isEqualTo("CAMERA_CONSENT_REQUIRED"));
        verify(imou, never()).deviceOnline(any(), any());
    }

    @Test
    void activePrivacyWinsBeforeProviderButExpiredPrivacyAllowsFreshCheck() {
        CameraDevice active = liveCamera();
        active.setPrivacyMode(true);
        active.setPrivacyModeExpiresAt(Instant.now().plusSeconds(60));
        when(cameraRepository.findById(42L)).thenReturn(Optional.of(active));
        allowLiveAccess();
        assertThatThrownBy(() -> service.getLiveStream(42L, 7L))
            .isInstanceOfSatisfying(CameraLinkException.class,
                ex -> assertThat(ex.getCode()).isEqualTo("CAMERA_PRIVACY_ACTIVE"));
        verify(imou, never()).deviceOnline(any(), any());

        CameraDevice expired = liveCamera();
        expired.setPrivacyMode(true);
        expired.setPrivacyModeExpiresAt(Instant.now().minusSeconds(1));
        when(cameraRepository.findById(42L)).thenReturn(Optional.of(expired));
        when(imou.deviceOnline("ABC123", "At_token"))
            .thenReturn(new ImouModels.DeviceOnlineData("ABC123", "0", List.of()));
        assertThatThrownBy(() -> service.getLiveStream(42L, 7L))
            .isInstanceOfSatisfying(CameraLinkException.class,
                ex -> assertThat(ex.getCode()).isEqualTo("CAMERA_OFFLINE"));
        assertThat(expired.isPrivacyMode()).isFalse();
    }

    @Test
    void confirmedOfflinePersistsOfflineAndReturnsLastKnownTime() {
        CameraDevice camera = liveCamera();
        Instant lastSeen = Instant.parse("2026-09-09T10:00:00Z");
        camera.setLastSeenAt(lastSeen);
        when(cameraRepository.findById(42L)).thenReturn(Optional.of(camera));
        allowLiveAccess();
        when(imou.deviceOnline("ABC123", "At_token"))
            .thenReturn(new ImouModels.DeviceOnlineData("ABC123", "0", List.of()));

        assertThatThrownBy(() -> service.getLiveStream(42L, 7L))
            .isInstanceOfSatisfying(CameraLinkException.class, ex -> {
                assertThat(ex.getCode()).isEqualTo("CAMERA_OFFLINE");
                assertThat(ex.getDetails()).containsEntry("lastSeenAt", lastSeen.toString());
            });
        assertThat(camera.getStatus()).isEqualTo(CameraDevice.CameraStatus.OFFLINE);
        verify(cameraRepository).save(camera);
        verify(imou, never()).getLiveStreamInfo(any(), any());
    }

    @Test
    void providerStatusFailureDoesNotChangeStoredStatus() {
        CameraDevice camera = liveCamera();
        camera.setStatus(CameraDevice.CameraStatus.OFFLINE);
        when(cameraRepository.findById(42L)).thenReturn(Optional.of(camera));
        allowLiveAccess();
        when(imou.deviceOnline("ABC123", "At_token")).thenThrow(new ImouApiException(
            ImouApiException.Kind.PROVIDER_UNAVAILABLE, "TRANSPORT_ERROR", "down"));
        assertThatThrownBy(() -> service.getLiveStream(42L, 7L))
            .isInstanceOfSatisfying(CameraLinkException.class,
                ex -> assertThat(ex.getCode()).isEqualTo("IMOU_PROVIDER_UNAVAILABLE"));
        assertThat(camera.getStatus()).isEqualTo(CameraDevice.CameraStatus.OFFLINE);
        verify(cameraRepository, never()).save(any());
    }

    @Test
    void malformedUnsupportedExpiredAndProviderStreamFailuresAreStable() {
        CameraDevice camera = liveCamera();
        when(cameraRepository.findById(42L)).thenReturn(Optional.of(camera));
        allowLiveAccess();
        when(imou.deviceOnline("ABC123", "At_token"))
            .thenReturn(new ImouModels.DeviceOnlineData("ABC123", "1", List.of()));

        when(imou.getLiveStreamInfo("ABC123", "At_token"))
            .thenReturn(new ImouModels.LiveStreamData(List.of()));
        assertLiveCode("CAMERA_STREAM_UNAVAILABLE");

        when(imou.getLiveStreamInfo("ABC123", "At_token"))
            .thenReturn(new ImouModels.LiveStreamData(List.of(
                new ImouModels.LiveStream("rtsp://video/live", 0, "0", "secret"))));
        assertLiveCode("CAMERA_UNSUPPORTED_STREAM");

        when(imou.getLiveStreamInfo("ABC123", "At_token"))
            .thenReturn(new ImouModels.LiveStreamData(List.of(
                new ImouModels.LiveStream("https://video/live.m3u8", 0, "2", "secret"))));
        assertLiveCode("CAMERA_STREAM_EXPIRED");

        when(imou.getLiveStreamInfo("ABC123", "At_token")).thenThrow(new ImouApiException(
            ImouApiException.Kind.INVALID_CREDENTIALS, "TK1002", "expired token"));
        assertLiveCode("IMOU_INVALID_CREDENTIALS");
    }

    @Test
    void expiredAccessTokenRefreshesAndRetriesOnlyOnce() {
        CameraDevice camera = liveCamera();
        when(cameraRepository.findById(42L)).thenReturn(Optional.of(camera));
        allowLiveAccess();
        when(imou.deviceOnline("ABC123", "At_token")).thenThrow(new ImouApiException(
            ImouApiException.Kind.INVALID_CREDENTIALS, "TK1002", "expired"));
        when(imou.getAccessToken()).thenReturn("At_fresh");
        when(imou.deviceOnline("ABC123", "At_fresh"))
            .thenReturn(new ImouModels.DeviceOnlineData("ABC123", "0", List.of()));

        assertLiveCode("CAMERA_OFFLINE");

        verify(imou).getAccessToken();
        verify(imou).deviceOnline("ABC123", "At_token");
        verify(imou).deviceOnline("ABC123", "At_fresh");
        assertThat(camera.getAccessToken()).isEqualTo("At_fresh");
    }

    @Test
    void invalidSigningCredentialsDoNotTriggerTokenRefresh() {
        CameraDevice camera = liveCamera();
        when(cameraRepository.findById(42L)).thenReturn(Optional.of(camera));
        allowLiveAccess();
        when(imou.deviceOnline("ABC123", "At_token")).thenThrow(new ImouApiException(
            ImouApiException.Kind.INVALID_CREDENTIALS, "SN1003", "invalid signature"));

        assertLiveCode("IMOU_INVALID_CREDENTIALS");

        verify(imou, never()).getAccessToken();
        assertThat(camera.getAccessToken()).isEqualTo("At_token");
    }

    @Test
    void providerFailureDuringStreamRetrievalDoesNotMarkCameraOffline() {
        CameraDevice camera = liveCamera();
        when(cameraRepository.findById(42L)).thenReturn(Optional.of(camera));
        allowLiveAccess();
        when(imou.deviceOnline("ABC123", "At_token"))
            .thenReturn(new ImouModels.DeviceOnlineData("ABC123", "1", List.of()));
        when(imou.getLiveStreamInfo("ABC123", "At_token")).thenThrow(new ImouApiException(
            ImouApiException.Kind.PROVIDER_UNAVAILABLE, "OP1010", "down"));

        assertLiveCode("IMOU_PROVIDER_UNAVAILABLE");

        assertThat(camera.getStatus()).isEqualTo(CameraDevice.CameraStatus.ONLINE);
        verify(cameraRepository).save(camera);
    }

    private void assertLiveCode(String code) {
        assertThatThrownBy(() -> service.getLiveStream(42L, 7L))
            .isInstanceOfSatisfying(CameraLinkException.class,
                ex -> assertThat(ex.getCode()).isEqualTo(code));
    }

    private void allowLiveAccess() {
        when(familyLinkRepository.existsByElderlyIdAndFamilyIdAndStatusAndDeletedAtIsNull(
            10L, 7L, com.carenest.backend.entity.FamilyLinkStatus.ACTIVE)).thenReturn(true);
        when(consentService.hasConsent(10L)).thenReturn(true);
    }

    private CameraDevice liveCamera() {
        return CameraDevice.builder()
            .id(42L)
            .elderly(User.builder().id(10L).build())
            .deviceSn("ABC123")
            .deviceId("ABC123")
            .label("Living room")
            .accessToken("At_token")
            .status(CameraDevice.CameraStatus.ONLINE)
            .build();
    }
}
