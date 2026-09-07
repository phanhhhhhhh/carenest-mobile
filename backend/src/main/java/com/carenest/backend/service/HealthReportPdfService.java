package com.carenest.backend.service;

import com.carenest.backend.dto.health.AppointmentReportItem;
import com.carenest.backend.dto.health.AppointmentReportSummary;
import com.carenest.backend.dto.health.HealthReportResponse;
import com.carenest.backend.dto.health.MedicationAdherenceReport;
import com.carenest.backend.dto.health.MetricDataPoint;
import com.carenest.backend.dto.health.MetricReport;
import org.openpdf.text.Document;
import org.openpdf.text.Element;
import org.openpdf.text.Font;
import org.openpdf.text.PageSize;
import org.openpdf.text.Paragraph;
import org.openpdf.text.Phrase;
import org.openpdf.text.pdf.BaseFont;
import org.openpdf.text.pdf.PdfPCell;
import org.openpdf.text.pdf.PdfPTable;
import org.openpdf.text.pdf.PdfWriter;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.awt.Color;
import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Locale;

@Service
public class HealthReportPdfService {

    public static final int MAX_DETAIL_ROWS = 2_000;
    public static final String DISCLAIMER = "This report summarizes information recorded in CareNest and is not a medical "
        + "diagnosis. Consult a qualified healthcare professional when medical advice is needed.";
    private static final ZoneId REPORT_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final Color PRIMARY = new Color(15, 118, 110);
    private static final Color HEADER_BG = new Color(226, 247, 245);

    public record PdfResult(byte[] bytes, String filename) {}

    public PdfResult generate(HealthReportResponse report) {
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            BaseFont baseFont = loadFont();
            Font title = new Font(baseFont, 20, Font.BOLD, PRIMARY);
            Font heading = new Font(baseFont, 13, Font.BOLD, PRIMARY);
            Font body = new Font(baseFont, 9, Font.NORMAL, Color.BLACK);
            Font bold = new Font(baseFont, 9, Font.BOLD, Color.BLACK);

            Document document = new Document(PageSize.A4, 36, 36, 42, 42);
            PdfWriter.getInstance(document, output);
            document.addTitle("CareNest Health Report");
            document.addAuthor("CareNest");
            document.open();

            Paragraph brand = new Paragraph("CareNest", new Font(baseFont, 11, Font.BOLD, PRIMARY));
            brand.setAlignment(Element.ALIGN_CENTER);
            document.add(brand);
            Paragraph reportTitle = new Paragraph("Health Report", title);
            reportTitle.setAlignment(Element.ALIGN_CENTER);
            reportTitle.setSpacingAfter(12);
            document.add(reportTitle);

            document.add(new Paragraph("Elderly person: " + value(report.getElderlyName()), bold));
            document.add(new Paragraph("Selected period: " + format(report.getFrom(), DATE) + " - "
                + format(report.getTo(), DATE), body));
            document.add(new Paragraph("Generated: " + OffsetDateTime.now(REPORT_ZONE).format(DATE_TIME)
                + " (Asia/Ho_Chi_Minh)", body));

            addSection(document, "Overview", heading);
            int metricCount = safe(report.getReports()).stream().mapToInt(r -> r.getStats().getCount()).sum();
            int medicationCount = safe(report.getMedicationAdherence()).size();
            int appointmentCount = report.getAppointmentSummary() == null ? 0 : report.getAppointmentSummary().getTotal();
            document.add(new Paragraph("Health readings: " + metricCount + " | Medications tracked: "
                + medicationCount + " | Appointments: " + appointmentCount, body));

            addMetricSummary(document, report, body, bold, heading);
            addDetails(document, report, body, bold, heading);
            addMedication(document, report, body, bold, heading);
            addAppointments(document, report, body, bold, heading);
            addWeeklySummary(document, report, body, heading);

            addSection(document, "Disclaimer", heading);
            Paragraph disclaimer = new Paragraph(DISCLAIMER, body);
            disclaimer.setLeading(13);
            document.add(disclaimer);
            document.close();

            return new PdfResult(output.toByteArray(), buildFilename(report));
        } catch (Exception exception) {
            throw new IllegalStateException("Unable to generate health report PDF", exception);
        }
    }

    private void addMetricSummary(Document document, HealthReportResponse report, Font body, Font bold, Font heading) {
        addSection(document, "Health metric summary", heading);
        if (safe(report.getReports()).isEmpty()) {
            addEmpty(document, "No health measurements were recorded for this period.", body);
            return;
        }
        PdfPTable table = table(7, new float[]{2.2f, 1.1f, .8f, 1f, 1f, 1f, 1.3f});
        header(table, bold, "Metric", "Unit", "Count", "Average", "Minimum", "Maximum", "Trend");
        for (MetricReport metric : report.getReports()) {
            cell(table, metricName(metric.getType()), body);
            cell(table, value(metric.getUnit()), body);
            cell(table, String.valueOf(metric.getStats().getCount()), body);
            cell(table, number(metric.getStats().getAvgValue()), body);
            cell(table, number(metric.getStats().getMinValue()), body);
            cell(table, number(metric.getStats().getMaxValue()), body);
            cell(table, value(metric.getStats().getTrend()), body);
        }
        document.add(table);
    }

    private void addDetails(Document document, HealthReportResponse report, Font body, Font bold, Font heading) {
        addSection(document, "Detailed readings", heading);
        int rendered = 0;
        int total = safe(report.getReports()).stream().mapToInt(r -> safe(r.getDataPoints()).size()).sum();
        if (total == 0) {
            addEmpty(document, "No detailed readings are available.", body);
            return;
        }
        boolean limitReached = false;
        for (MetricReport metric : report.getReports()) {
            if (rendered >= MAX_DETAIL_ROWS) break;
            Paragraph metricHeading = new Paragraph(metricName(metric.getType()), bold);
            metricHeading.setSpacingBefore(7);
            metricHeading.setSpacingAfter(4);
            document.add(metricHeading);
            PdfPTable table = table(4, new float[]{1.7f, 1.1f, 1.1f, 3.1f});
            header(table, bold, "Timestamp", "Primary", "Secondary", "Notes");
            for (MetricDataPoint point : safe(metric.getDataPoints())) {
                if (rendered >= MAX_DETAIL_ROWS) {
                    limitReached = true;
                    break;
                }
                cell(table, format(point.getRecordedAt(), DATE_TIME), body);
                cell(table, number(point.getValue()), body);
                cell(table, number(point.getValueSecondary()), body);
                cell(table, value(point.getNotes()), body);
                rendered++;
            }
            document.add(table);
            if (limitReached) break;
        }
        if (rendered < total) {
            Paragraph note = new Paragraph("Detail limit reached: showing " + rendered + " of " + total
                + " readings. Narrow the date range or metric filters to export the remaining rows.", bold);
            note.setSpacingBefore(8);
            document.add(note);
        }
    }

    private void addMedication(Document document, HealthReportResponse report, Font body, Font bold, Font heading) {
        addSection(document, "Medication adherence", heading);
        if (safe(report.getMedicationAdherence()).isEmpty()) {
            addEmpty(document, "No medication adherence data is available for this period.", body);
            return;
        }
        PdfPTable table = table(5, new float[]{3f, 1f, 1f, 1f, 1.5f});
        header(table, bold, "Medication", "Taken", "Missed", "Skipped", "Adherence");
        for (MedicationAdherenceReport medication : report.getMedicationAdherence()) {
            cell(table, value(medication.getMedicationName()), body);
            cell(table, String.valueOf(medication.getTaken()), body);
            cell(table, String.valueOf(medication.getMissed()), body);
            cell(table, String.valueOf(medication.getSkipped()), body);
            cell(table, medication.getAdherencePercentage() == null ? "N/A"
                : number(medication.getAdherencePercentage()) + "%", body);
        }
        document.add(table);
    }

    private void addAppointments(Document document, HealthReportResponse report, Font body, Font bold, Font heading) {
        addSection(document, "Appointment summary", heading);
        AppointmentReportSummary summary = report.getAppointmentSummary();
        if (summary == null || summary.getTotal() == 0) {
            addEmpty(document, "No appointments were recorded for this period.", body);
            return;
        }
        document.add(new Paragraph("Total: " + summary.getTotal() + " | Scheduled: " + summary.getScheduled()
            + " | Completed: " + summary.getCompleted() + " | Cancelled: " + summary.getCancelled()
            + " | Missed: " + summary.getMissed(), body));
        PdfPTable table = table(5, new float[]{1.4f, 1.6f, 1.5f, 2f, 1.2f});
        header(table, bold, "Date", "Doctor", "Specialty", "Location", "Status");
        for (AppointmentReportItem appointment : safe(summary.getAppointments())) {
            cell(table, format(appointment.getDatetime(), DATE_TIME), body);
            cell(table, value(appointment.getDoctor()), body);
            cell(table, value(appointment.getSpecialty()), body);
            cell(table, value(appointment.getLocation()), body);
            cell(table, value(appointment.getStatus()), body);
        }
        document.add(table);
    }

    private void addWeeklySummary(Document document, HealthReportResponse report, Font body, Font heading) {
        addSection(document, "Latest stored weekly summary", heading);
        if (report.getLatestWeeklySummary() == null) {
            addEmpty(document, "No stored weekly summary is available.", body);
            return;
        }
        if (report.getLatestWeeklySummary().getTitle() != null) {
            document.add(new Paragraph(report.getLatestWeeklySummary().getTitle(), body));
        }
        if (report.getLatestWeeklySummary().getBody() != null) {
            Paragraph content = new Paragraph(report.getLatestWeeklySummary().getBody(), body);
            content.setLeading(13);
            document.add(content);
        }
    }

    private BaseFont loadFont() throws IOException {
        try (InputStream stream = getClass().getResourceAsStream("/fonts/NotoSans-Regular.ttf")) {
            if (stream == null) throw new IOException("Bundled report font is missing");
            byte[] bytes = stream.readAllBytes();
            return BaseFont.createFont("NotoSans-Regular.ttf", BaseFont.IDENTITY_H, BaseFont.EMBEDDED,
                true, bytes, null);
        }
    }

    private PdfPTable table(int columns, float[] widths) {
        PdfPTable table = new PdfPTable(columns);
        table.setWidthPercentage(100);
        table.setWidths(widths);
        table.setHeaderRows(1);
        table.setSpacingBefore(6);
        table.setSpacingAfter(8);
        table.setSplitRows(true);
        table.setSplitLate(false);
        return table;
    }

    private void header(PdfPTable table, Font font, String... labels) {
        for (String label : labels) {
            PdfPCell cell = new PdfPCell(new Phrase(label, font));
            cell.setBackgroundColor(HEADER_BG);
            cell.setPadding(5);
            table.addCell(cell);
        }
    }

    private void cell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setPadding(4);
        cell.setVerticalAlignment(Element.ALIGN_MIDDLE);
        table.addCell(cell);
    }

    private void addSection(Document document, String text, Font heading) {
        Paragraph paragraph = new Paragraph(text, heading);
        paragraph.setSpacingBefore(14);
        paragraph.setSpacingAfter(5);
        document.add(paragraph);
    }

    private void addEmpty(Document document, String text, Font body) {
        document.add(new Paragraph(text, body));
    }

    private String buildFilename(HealthReportResponse report) {
        String normalized = Normalizer.normalize(value(report.getElderlyName()), Normalizer.Form.NFD)
            .replaceAll("\\p{M}+", "")
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("(^-+|-+$)", "");
        if (normalized.isBlank()) normalized = "elderly-" + report.getElderlyId();
        return "carenest-health-report-" + normalized + "-" + format(report.getTo(),
            DateTimeFormatter.BASIC_ISO_DATE) + ".pdf";
    }

    private String metricName(String type) {
        if (type == null) return "Unknown";
        return switch (type) {
            case "BLOOD_PRESSURE" -> "Blood pressure";
            case "HEART_RATE" -> "Heart rate";
            case "BLOOD_GLUCOSE" -> "Blood glucose";
            case "WEIGHT" -> "Weight";
            case "TEMPERATURE" -> "Temperature";
            case "SPO2" -> "SpO2";
            default -> type.replace('_', ' ');
        };
    }

    private String format(OffsetDateTime value, DateTimeFormatter formatter) {
        return value == null ? "N/A" : value.atZoneSameInstant(REPORT_ZONE).format(formatter);
    }

    private String number(BigDecimal value) {
        return value == null ? "N/A" : value.stripTrailingZeros().toPlainString();
    }

    private String value(String value) {
        return value == null || value.isBlank() ? "N/A" : value;
    }

    private <T> List<T> safe(List<T> values) {
        return values == null ? List.of() : values;
    }
}
