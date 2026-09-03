package com.carenest.backend.service;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.carenest.backend.repository.CameraDeviceRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionStatus;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class CameraTokenRefreshServiceTest {

    private CameraDeviceRepository repository;
    private CameraTokenUpdater updater;
    private ImouApiService imouApiService;
    private JdbcTemplate jdbcTemplate;
    private CameraTokenRefreshService service;

    @BeforeEach
    void setUp() {
        repository = mock(CameraDeviceRepository.class);
        updater = mock(CameraTokenUpdater.class);
        imouApiService = mock(ImouApiService.class);
        jdbcTemplate = mock(JdbcTemplate.class);
        PlatformTransactionManager transactionManager = mock(PlatformTransactionManager.class);
        TransactionStatus transactionStatus = mock(TransactionStatus.class);
        when(transactionManager.getTransaction(any())).thenReturn(transactionStatus);
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class), anyLong())).thenReturn(true);
        when(imouApiService.isConfigured()).thenReturn(true);
        service = new CameraTokenRefreshService(
            repository, updater, imouApiService, jdbcTemplate, transactionManager, 3, 0);
    }

    @Test
    void successfulRefreshRequestsOneTokenAndUpdatesEveryEligibleCamera() {
        when(repository.findIdsWithAccessToken()).thenReturn(List.of(10L, 20L));
        when(imouApiService.getAccessToken()).thenReturn("new-token");

        CameraTokenRefreshService.RefreshSummary summary = service.refreshTokens();

        assertThat(summary.eligible()).isEqualTo(2);
        assertThat(summary.successful()).isEqualTo(2);
        assertThat(summary.failed()).isZero();
        verify(imouApiService, times(1)).getAccessToken();
        verify(updater).updateToken(eq(10L), eq("new-token"), any(Instant.class));
        verify(updater).updateToken(eq(20L), eq("new-token"), any(Instant.class));
    }

    @Test
    void offlineCamerasRemainEligibleBecauseSelectionDoesNotFilterByStatus() {
        when(repository.findIdsWithAccessToken()).thenReturn(List.of(30L));
        when(imouApiService.getAccessToken()).thenReturn("new-token");

        service.refreshTokens();

        verify(repository).findIdsWithAccessToken();
        verify(updater).updateToken(eq(30L), eq("new-token"), any(Instant.class));
    }

    @Test
    void missingConfigurationSkipsWithoutReadingOrChangingCameras() {
        when(imouApiService.isConfigured()).thenReturn(false);

        CameraTokenRefreshService.RefreshSummary summary = service.refreshTokens();

        assertThat(summary.eligible()).isZero();
        verify(imouApiService, never()).getAccessToken();
        verify(repository, never()).findIdsWithAccessToken();
        verifyNoInteractions(updater);
    }

    @Test
    void noEligibleCamerasDoesNotRequestToken() {
        when(repository.findIdsWithAccessToken()).thenReturn(List.of());

        CameraTokenRefreshService.RefreshSummary summary = service.refreshTokens();

        assertThat(summary.eligible()).isZero();
        assertThat(summary.successful()).isZero();
        verify(imouApiService, never()).getAccessToken();
        verifyNoInteractions(updater);
    }

    @Test
    void transientTokenFailureIsRetriedAndThenUpdatesCameras() {
        when(repository.findIdsWithAccessToken()).thenReturn(List.of(10L));
        when(imouApiService.getAccessToken())
            .thenThrow(new RuntimeException("timeout"))
            .thenReturn("new-token");

        CameraTokenRefreshService.RefreshSummary summary = service.refreshTokens();

        assertThat(summary.successful()).isOne();
        verify(imouApiService, times(2)).getAccessToken();
        verify(updater).updateToken(eq(10L), eq("new-token"), any(Instant.class));
    }

    @Test
    void permanentTokenFailurePreservesExistingCameraValues() {
        when(repository.findIdsWithAccessToken()).thenReturn(List.of(10L, 20L));
        when(imouApiService.getAccessToken()).thenReturn(null);

        CameraTokenRefreshService.RefreshSummary summary = service.refreshTokens();

        assertThat(summary.failed()).isEqualTo(2);
        verify(imouApiService, times(3)).getAccessToken();
        verifyNoInteractions(updater);
    }

    @Test
    void oneCameraUpdateFailureDoesNotAbortRemainingUpdates() {
        when(repository.findIdsWithAccessToken()).thenReturn(List.of(10L, 20L, 30L));
        when(imouApiService.getAccessToken()).thenReturn("new-token");
        doThrow(new RuntimeException("database failure"))
            .when(updater).updateToken(eq(20L), eq("new-token"), any(Instant.class));

        CameraTokenRefreshService.RefreshSummary summary = service.refreshTokens();

        assertThat(summary.successful()).isEqualTo(2);
        assertThat(summary.failed()).isOne();
        verify(updater).updateToken(eq(10L), eq("new-token"), any(Instant.class));
        verify(updater).updateToken(eq(20L), eq("new-token"), any(Instant.class));
        verify(updater).updateToken(eq(30L), eq("new-token"), any(Instant.class));
    }

    @Test
    void concurrentExecutionDoesNotRequestAnotherToken() {
        when(jdbcTemplate.queryForObject(anyString(), eq(Boolean.class), anyLong())).thenReturn(false);

        CameraTokenRefreshService.RefreshSummary summary = service.refreshTokens();

        assertThat(summary.skipped()).isOne();
        verifyNoInteractions(repository, updater);
        verify(imouApiService, never()).getAccessToken();
    }

    @Test
    void sensitiveValuesAreNotLoggedOnFailures() {
        String sensitiveValue = "secret-app-id-or-token";
        when(repository.findIdsWithAccessToken()).thenReturn(List.of(10L));
        when(imouApiService.getAccessToken()).thenThrow(new RuntimeException(sensitiveValue));
        Logger logger = (Logger) LoggerFactory.getLogger(CameraTokenRefreshService.class);
        ListAppender<ILoggingEvent> appender = new ListAppender<>();
        appender.setContext(logger.getLoggerContext());
        appender.start();
        logger.addAppender(appender);

        try {
            service.refreshTokens();
        } finally {
            logger.detachAppender(appender);
        }

        assertThat(appender.list)
            .extracting(ILoggingEvent::getFormattedMessage)
            .allMatch(message -> !message.contains(sensitiveValue));
        assertThat(appender.list).anyMatch(event -> event.getLevel() == Level.WARN);
    }
}
