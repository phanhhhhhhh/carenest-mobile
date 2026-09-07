package com.carenest.backend.controller;

import com.carenest.backend.entity.HealthMetricType;
import com.carenest.backend.service.HealthReportPdfService;
import com.carenest.backend.service.HealthReportService;
import com.carenest.backend.service.SubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.CacheControl;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Set;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class HealthReportExportController {

    public static final int MAX_EXPORT_DAYS = 365;

    private final SubscriptionService subscriptionService;
    private final HealthReportService healthReportService;
    private final HealthReportPdfService healthReportPdfService;

    @GetMapping(value = "/elderly/{elderlyId}/health-report.pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @PreAuthorize("hasRole('FAMILY') and @authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<byte[]> export(
        @AuthenticationPrincipal Long familyId,
        @PathVariable Long elderlyId,
        @RequestParam(required = false) Set<HealthMetricType> types,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to
    ) {
        subscriptionService.requirePremium(familyId);

        HealthReportService.ReportPeriod period = healthReportService.resolvePeriod(from, to);
        if (Duration.between(period.from(), period.to()).compareTo(Duration.ofDays(MAX_EXPORT_DAYS)) > 0) {
            throw new IllegalArgumentException("PDF export date range cannot exceed 365 days");
        }

        var report = healthReportService.generateReport(elderlyId, types, period.from(), period.to());
        HealthReportPdfService.PdfResult pdf = healthReportPdfService.generate(report);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        headers.setContentDisposition(ContentDisposition.attachment()
            .filename(pdf.filename(), StandardCharsets.UTF_8)
            .build());
        headers.setCacheControl(CacheControl.noStore().cachePrivate());
        headers.set("X-Content-Type-Options", "nosniff");
        headers.setContentLength(pdf.bytes().length);
        return ResponseEntity.ok().headers(headers).body(pdf.bytes());
    }
}
