package com.carenest.backend.service;

import com.carenest.backend.dto.health.AppointmentReportSummary;
import com.carenest.backend.dto.health.HealthReportResponse;
import com.carenest.backend.dto.health.MedicationAdherenceReport;
import com.carenest.backend.dto.health.MetricDataPoint;
import com.carenest.backend.dto.health.MetricReport;
import com.carenest.backend.dto.health.MetricStats;
import com.carenest.backend.dto.health.WeeklySummarySnapshot;
import org.junit.jupiter.api.Test;
import org.openpdf.text.pdf.PdfReader;
import org.openpdf.text.pdf.parser.PdfTextExtractor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertTrue;

class HealthReportPdfServiceTest {

    private final HealthReportPdfService service = new HealthReportPdfService();

    @Test
    void rendersTitleVietnameseNameMultipleMetricsSecondaryValueAndDisclaimer() throws Exception {
        HealthReportResponse report = representativeReport(List.of(
            metric("BLOOD_PRESSURE", "mmHg", List.of(point("128", "82", "Sau khi nghỉ"))),
            metric("HEART_RATE", "bpm", List.of(point("72", null, null)))
        ));

        HealthReportPdfService.PdfResult result = service.generate(report);

        assertArrayEquals("%PDF".getBytes(), java.util.Arrays.copyOf(result.bytes(), 4));
        String text = extractAll(result.bytes()).replaceAll("\\s+", " ");
        assertTrue(text.contains("Health Report"));
        assertTrue(text.contains("Nguyễn Thị Ánh"));
        assertTrue(text.contains("Blood pressure"));
        assertTrue(text.contains("Heart rate"));
        assertTrue(text.contains("82"));
        assertTrue(text.contains("Thuốc huyết áp"));
        assertTrue(text.contains("not a medical"));
        assertTrue(text.contains("qualified healthcare professional"));
    }

    @Test
    void emptyOptionalSectionsProduceValidPdf() {
        HealthReportResponse empty = HealthReportResponse.builder()
            .elderlyId(11L)
            .elderlyName("Bà Sáu")
            .from(at(1))
            .to(at(8))
            .reports(List.of())
            .medicationAdherence(List.of())
            .appointmentSummary(null)
            .latestWeeklySummary(null)
            .build();

        assertDoesNotThrow(() -> service.generate(empty));
        assertTrue(service.generate(empty).bytes().length > 100);
    }

    @Test
    void largeInputCreatesReadableMultiPagePdf() throws Exception {
        List<MetricDataPoint> points = new ArrayList<>();
        for (int i = 0; i < 300; i++) {
            points.add(MetricDataPoint.builder()
                .recordedAt(at(1).plusMinutes(i * 30L))
                .value(BigDecimal.valueOf(60 + (i % 40)))
                .notes("Reading " + (i + 1))
                .build());
        }

        byte[] bytes = service.generate(representativeReport(List.of(metric("HEART_RATE", "bpm", points)))).bytes();
        try (PdfReader reader = new PdfReader(bytes)) {
            assertTrue(reader.getNumberOfPages() > 1);
        }
    }

    @Test
    void rowLimitIsDisclosedInsideThePdf() throws Exception {
        List<MetricDataPoint> points = new ArrayList<>();
        for (int i = 0; i < HealthReportPdfService.MAX_DETAIL_ROWS + 1; i++) {
            points.add(MetricDataPoint.builder()
                .recordedAt(at(1).plusMinutes(i))
                .value(BigDecimal.valueOf(70))
                .build());
        }

        byte[] bytes = service.generate(representativeReport(List.of(metric("HEART_RATE", "bpm", points)))).bytes();
        assertTrue(extractAll(bytes).contains("Detail limit reached"));
    }

    private HealthReportResponse representativeReport(List<MetricReport> metrics) {
        return HealthReportResponse.builder()
            .elderlyId(11L)
            .elderlyName("Nguyễn Thị Ánh")
            .from(at(1))
            .to(at(8))
            .reports(metrics)
            .medicationAdherence(List.of(MedicationAdherenceReport.builder()
                .medicationId(5L)
                .medicationName("Thuốc huyết áp")
                .taken(6)
                .missed(1)
                .skipped(0)
                .adherencePercentage(new BigDecimal("85.7"))
                .build()))
            .appointmentSummary(AppointmentReportSummary.builder()
                .total(0)
                .appointments(List.of())
                .build())
            .latestWeeklySummary(WeeklySummarySnapshot.builder()
                .title("Tóm tắt tuần")
                .body("Sức khỏe được theo dõi đều đặn.")
                .createdAt(at(7))
                .build())
            .build();
    }

    private MetricReport metric(String type, String unit, List<MetricDataPoint> points) {
        BigDecimal min = points.stream().map(MetricDataPoint::getValue).min(BigDecimal::compareTo).orElse(null);
        BigDecimal max = points.stream().map(MetricDataPoint::getValue).max(BigDecimal::compareTo).orElse(null);
        return MetricReport.builder()
            .type(type)
            .unit(unit)
            .dataPoints(points)
            .stats(MetricStats.builder()
                .count(points.size())
                .avgValue(min)
                .minValue(min)
                .maxValue(max)
                .trend("STABLE")
                .build())
            .build();
    }

    private MetricDataPoint point(String primary, String secondary, String notes) {
        return MetricDataPoint.builder()
            .recordedAt(at(2))
            .value(new BigDecimal(primary))
            .valueSecondary(secondary == null ? null : new BigDecimal(secondary))
            .notes(notes)
            .build();
    }

    private OffsetDateTime at(int day) {
        return OffsetDateTime.of(2026, 9, day, 10, 0, 0, 0, ZoneOffset.ofHours(7));
    }

    private String extractAll(byte[] bytes) throws Exception {
        try (PdfReader reader = new PdfReader(bytes)) {
            PdfTextExtractor extractor = new PdfTextExtractor(reader);
            StringBuilder text = new StringBuilder();
            for (int page = 1; page <= reader.getNumberOfPages(); page++) {
                text.append(extractor.getTextFromPage(page));
            }
            return text.toString();
        }
    }
}
