package com.carenest.backend.seeder;

import com.carenest.backend.entity.Appointment;
import com.carenest.backend.entity.AppointmentStatus;
import com.carenest.backend.entity.ElderlyProfile;
import com.carenest.backend.entity.EmergencyContact;
import com.carenest.backend.entity.FamilyLink;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.HealthMetric;
import com.carenest.backend.entity.HealthMetricType;
import com.carenest.backend.entity.Medication;
import com.carenest.backend.entity.MedicationLog;
import com.carenest.backend.entity.MedicationLogStatus;
import com.carenest.backend.entity.MedicationSchedule;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.entity.CameraDevice;
import com.carenest.backend.entity.ChatMessage;
import com.carenest.backend.entity.Subscription;
import com.carenest.backend.repository.AppointmentRepository;
import com.carenest.backend.repository.CameraDeviceRepository;
import com.carenest.backend.repository.ChatMessageRepository;
import com.carenest.backend.repository.ElderlyProfileRepository;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.HealthMetricRepository;
import com.carenest.backend.repository.MedicationLogRepository;
import com.carenest.backend.repository.MedicationRepository;
import com.carenest.backend.repository.SubscriptionRepository;
import com.carenest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    @Value("${carenest.seed.enabled:false}")
    private boolean seedEnabled;

    private final UserRepository userRepository;
    private final ElderlyProfileRepository elderlyProfileRepository;
    private final FamilyLinkRepository familyLinkRepository;
    private final MedicationRepository medicationRepository;
    private final MedicationLogRepository medicationLogRepository;
    private final HealthMetricRepository healthMetricRepository;
    private final AppointmentRepository appointmentRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final CameraDeviceRepository cameraDeviceRepository;

    private final List<User> elderlyUsers = new ArrayList<>();
    private final List<User> familyUsers = new ArrayList<>();
    private final List<Medication> medications = new ArrayList<>();

    @Override
    @Transactional
    public void run(String... args) {
        if (!seedEnabled) {
            log.debug("DataSeeder skipped — carenest.seed.enabled is false.");
            return;
        }
        if (userRepository.count() > 0) {
            log.info("Seed data already exists, skipping.");
            return;
        }

        log.info("Starting seed data creation...");
        seedUsers();
        seedMedications();
        seedMedicationLogs();
        seedHealthMetrics();
        seedAppointments();
        seedChatMessages();
        seedSubscriptions();
        seedCameras();
        log.info("Seed data created successfully.");
    }

    private void seedUsers() {
        log.info("Seeding users...");

        User e1 = saveUser("John Anderson",  "+84912345001", LocalDate.of(1948, 3, 15),  UserRole.ELDERLY);
        User e2 = saveUser("Jane Thompson",   "+84912345002", LocalDate.of(1945, 7, 22),  UserRole.ELDERLY);
        User e3 = saveUser("Robert Lee",    "+84912345003", LocalDate.of(1950, 11, 8),  UserRole.ELDERLY);
        User e4 = saveUser("Mary Pham",   "+84912345004", LocalDate.of(1943, 1, 30),  UserRole.ELDERLY);
        User e5 = saveUser("William Hoang",    "+84912345005", LocalDate.of(1952, 9, 12),  UserRole.ELDERLY);

        elderlyUsers.addAll(List.of(e1, e2, e3, e4, e5));

        saveElderlyProfile(e1,
            List.of("Type 2 Diabetes", "Hypertension"),
            List.of(EmergencyContact.builder()
                .name("Linda Nguyen").phone("0912111001").relationship("Daughter").build()));

        saveElderlyProfile(e2,
            List.of("Heart Failure Class II", "Atrial Fibrillation"),
            List.of(EmergencyContact.builder()
                .name("Michael Tran").phone("0912111002").relationship("Son").build()));

        saveElderlyProfile(e3,
            List.of("COPD", "Knee Osteoarthritis"),
            List.of(EmergencyContact.builder()
                .name("Sarah Le").phone("0912111003").relationship("Wife").build()));

        saveElderlyProfile(e4,
            List.of("Early-stage Alzheimer", "Osteoporosis"),
            List.of(EmergencyContact.builder()
                .name("David Pham").phone("0912111004").relationship("Son").build()));

        saveElderlyProfile(e5,
            List.of("Parkinson Stage 2", "Depression"),
            List.of(EmergencyContact.builder()
                .name("Emily Hoang").phone("0912111005").relationship("Daughter").build()));

        User f1  = saveUser("Linda Nguyen",  "+84918111001", null, UserRole.FAMILY);
        User f2  = saveUser("Michael Tran",    "+84918111002", null, UserRole.FAMILY);
        User f3  = saveUser("Sarah Le",       "+84918111003", null, UserRole.FAMILY);
        User f4  = saveUser("David Pham",     "+84918111004", null, UserRole.FAMILY);
        User f5  = saveUser("Emily Hoang", "+84918111005", null, UserRole.FAMILY);
        User f6  = saveUser("Anna Vu",       "+84918111006", null, UserRole.FAMILY);
        User f7  = saveUser("Nathan Dang",     "+84918111007", null, UserRole.FAMILY);
        User f8  = saveUser("Olivia Bui",     "+84918111008", null, UserRole.FAMILY);
        User f9  = saveUser("Peter Do",     "+84918111009", null, UserRole.FAMILY);
        User f10 = saveUser("Quinn Ngo",    "+84918111010", null, UserRole.FAMILY);

        familyUsers.addAll(List.of(f1, f2, f3, f4, f5, f6, f7, f8, f9, f10));

        saveFamilyLink(e1, f1, "Daughter");
        saveFamilyLink(e2, f2, "Son");
        saveFamilyLink(e3, f3, "Wife");
        saveFamilyLink(e4, f4, "Son");
        saveFamilyLink(e5, f5, "Daughter");

        saveFamilyLink(e1, f6,  "Relative");
        saveFamilyLink(e1, f7,  "Relative");
        saveFamilyLink(e1, f8,  "Relative");
        saveFamilyLink(e2, f9,  "Relative");
        saveFamilyLink(e2, f10, "Relative");

        log.info("Seeded {} elderly + {} family users.", elderlyUsers.size(), familyUsers.size());
    }

    private User saveUser(String name, String phone, LocalDate dob, UserRole role) {
        User user = User.builder()
            .name(name)
            .phone(phone)
            .dob(dob)
            .role(role)
            .build();
        return userRepository.save(user);
    }

    private void saveElderlyProfile(User user, List<String> healthConditions, List<EmergencyContact> emergencyContacts) {
        ElderlyProfile profile = ElderlyProfile.builder()
            .user(user)
            .healthConditions(healthConditions)
            .emergencyContacts(emergencyContacts)
            .build();
        elderlyProfileRepository.save(profile);
    }

    private void saveFamilyLink(User elderly, User family, String relationship) {
        FamilyLink link = FamilyLink.builder()
            .elderly(elderly)
            .family(family)
            .relationship(relationship)
            .status(FamilyLinkStatus.ACTIVE)
            .build();
        familyLinkRepository.save(link);
    }

    private void seedMedications() {
        log.info("Seeding medications...");

        User e1 = elderlyUsers.get(0);
        User e2 = elderlyUsers.get(1);
        User e3 = elderlyUsers.get(2);

        OffsetDateTime now = OffsetDateTime.now();

        medications.add(saveMedication(e1, "Metformin", "500mg",
            schedule("TWICE_DAILY", "07:30", "19:30"), "Take after meals",
            nextDoseFromNow(now, 12)));

        medications.add(saveMedication(e1, "Amlodipine", "5mg",
            schedule("DAILY", "08:00"), "Take in the morning",
            nextDoseFromNow(now, 24)));

        medications.add(saveMedication(e1, "Aspirin", "81mg",
            schedule("DAILY", "08:00"), "Take after breakfast",
            nextDoseFromNow(now, 24)));

        medications.add(saveMedication(e2, "Furosemide", "40mg",
            schedule("DAILY", "07:00"), "Monitor for edema",
            nextDoseFromNow(now, 24)));

        medications.add(saveMedication(e2, "Bisoprolol", "2.5mg",
            schedule("DAILY", "08:00"), "Do not stop abruptly",
            nextDoseFromNow(now, 24)));

        medications.add(saveMedication(e2, "Warfarin", "5mg",
            schedule("DAILY", "18:00"), "Monitor INR regularly",
            nextDoseFromNow(now, 8)));

        medications.add(saveMedication(e3, "Salbutamol inhaler", "100mcg/dose",
            scheduleAsNeeded(), "Use when short of breath",
            null));

        medications.add(saveMedication(e3, "Tiotropium inhaler", "18mcg/dose",
            schedule("DAILY", "08:00"), "Inhale in the morning",
            nextDoseFromNow(now, 24)));

        log.info("Seeded {} medications.", medications.size());
    }

    private MedicationSchedule schedule(String frequency, String... times) {
        return MedicationSchedule.builder()
            .frequency(frequency)
            .times(List.of(times))
            .build();
    }

    private MedicationSchedule scheduleAsNeeded() {
        return MedicationSchedule.builder()
            .frequency("AS_NEEDED")
            .times(List.of())
            .build();
    }

    private OffsetDateTime nextDoseFromNow(OffsetDateTime now, int hoursAhead) {
        return now.plusHours(hoursAhead);
    }

    private Medication saveMedication(User elderly, String name, String dosage,
                                      MedicationSchedule schedule, String instructions,
                                      OffsetDateTime nextDoseTime) {
        Medication med = Medication.builder()
            .elderly(elderly)
            .name(name)
            .dosage(dosage)
            .schedule(schedule)
            .instructions(instructions)
            .nextDoseTime(nextDoseTime)
            .build();
        return medicationRepository.save(med);
    }

    private MedicationLogStatus logStatus(int index) {
        int mod = index % 20;
        if (mod <= 16) return MedicationLogStatus.TAKEN;
        if (mod <= 18) return MedicationLogStatus.MISSED;
        return MedicationLogStatus.SKIPPED;
    }

    private void seedMedicationLogs() {
        log.info("Seeding medication logs (30 days)...");

        List<Medication> loggableMeds = medications.subList(0, 6);

        OffsetDateTime reference = OffsetDateTime.now();

        int globalIndex = 0;
        for (Medication med : loggableMeds) {
            List<String> times = med.getSchedule().getTimes();
            if (times == null || times.isEmpty()) continue;

            for (int day = 29; day >= 0; day--) {
                OffsetDateTime dayBase = reference.minusDays(day);

                for (String timeStr : times) {
                    LocalTime lt = LocalTime.parse(timeStr);
                    OffsetDateTime takenAt = dayBase
                        .withHour(lt.getHour())
                        .withMinute(lt.getMinute())
                        .withSecond(0)
                        .withNano(0);

                    MedicationLogStatus status = logStatus(globalIndex++);

                    MedicationLog logEntry = MedicationLog.builder()
                        .medication(med)
                        .takenAt(takenAt)
                        .status(status)
                        .build();
                    medicationLogRepository.save(logEntry);
                }
            }
        }

        log.info("Medication logs seeded.");
    }

    private void seedHealthMetrics() {
        log.info("Seeding health metrics (30 days, twice daily)...");

        User e1 = elderlyUsers.get(0);
        User e2 = elderlyUsers.get(1);

        OffsetDateTime reference = OffsetDateTime.now();

        for (int day = 29; day >= 0; day--) {
            OffsetDateTime dayBase = reference.minusDays(day).withSecond(0).withNano(0);

            for (int session = 0; session < 2; session++) {
                int hour = (session == 0) ? 8 : 20;
                OffsetDateTime recordedAt = dayBase.withHour(hour).withMinute(0);

                int d = day;

                double systolic1 = 130.0 + (d % 5) * 1.0 + (session * 2);

                double diastolic1 = 80.0 + (d % 5) * 0.5 + (session * 1);
                saveHealthMetric(e1, HealthMetricType.BLOOD_PRESSURE,
                    bd(systolic1), bd(diastolic1), "mmHg", recordedAt);

                double hr1 = 68.0 + (d % 7) * 2.0 + (session * 1);
                saveHealthMetric(e1, HealthMetricType.HEART_RATE,
                    bd(hr1), null, "bpm", recordedAt);

                double glucose = 7.2 + (d % 10) * 0.43 + (session == 0 ? 1.5 : 0.0);
                saveHealthMetric(e1, HealthMetricType.BLOOD_GLUCOSE,
                    bd(glucose), null, "mmol/L", recordedAt);

                double systolic2 = 115.0 + (d % 5) * 0.5 + (session * 1);

                double diastolic2 = 72.0 + (d % 5) * 0.4 + (session * 0.8);
                saveHealthMetric(e2, HealthMetricType.BLOOD_PRESSURE,
                    bd(systolic2), bd(diastolic2), "mmHg", recordedAt);

                double hr2 = 58.0 + (d % 9) * 1.0 + (session * 1);
                saveHealthMetric(e2, HealthMetricType.HEART_RATE,
                    bd(hr2), null, "bpm", recordedAt);
            }
        }

        log.info("Health metrics seeded.");
    }

    private void saveHealthMetric(User elderly, HealthMetricType type,
                                  BigDecimal value, BigDecimal valueSecondary,
                                  String unit, OffsetDateTime recordedAt) {
        HealthMetric metric = HealthMetric.builder()
            .elderly(elderly)
            .type(type)
            .value(value)
            .valueSecondary(valueSecondary)
            .unit(unit)
            .recordedAt(recordedAt)
            .build();
        healthMetricRepository.save(metric);
    }

    private BigDecimal bd(double value) {
        return BigDecimal.valueOf(Math.round(value * 100.0) / 100.0);
    }

    private void seedAppointments() {
        log.info("Seeding appointments...");

        OffsetDateTime now = OffsetDateTime.now();

        for (User elderly : elderlyUsers) {

            saveAppointment(elderly,
                "Endocrinology follow-up",
                "Dr. Michael Nguyen",
                "Endocrinology - Diabetes",
                "City General Hospital",
                now.plusWeeks(2).withHour(9).withMinute(0).withSecond(0).withNano(0));

            saveAppointment(elderly,
                "Routine blood work",
                "Dr. Hannah Tran",
                "Laboratory",
                "Lab Medlatec",
                now.plusWeeks(3).withHour(7).withMinute(30).withSecond(0).withNano(0));

            saveAppointment(elderly,
                "Cardiology check-up",
                "Dr. Felix Le",
                "Cardiology",
                "Heart Institute",
                now.plusWeeks(6).withHour(10).withMinute(0).withSecond(0).withNano(0));
        }

        log.info("Appointments seeded ({} total).", elderlyUsers.size() * 3);
    }

    private void saveAppointment(User elderly, String notes, String doctor,
                                 String specialty, String location,
                                 OffsetDateTime datetime) {
        Appointment appointment = Appointment.builder()
            .elderly(elderly)
            .doctor(doctor)
            .specialty(specialty)
            .location(location)
            .datetime(datetime)
            .notes(notes)
            .status(AppointmentStatus.SCHEDULED)
            .build();
        appointmentRepository.save(appointment);
    }

    // ── New: Chat Messages Seed ──────────────────────────────────────────

    private void seedChatMessages() {
        log.info("Seeding chat messages...");
        User e1 = elderlyUsers.get(0);

        String[][] convos = {
            {"Good morning! How are you feeling today?",
             "I'm a bit tired. My back hurts.",
             "HEALTH"},
            {"What time do I take my blood pressure medicine?",
             "Your Amlodipine 5mg is scheduled for 8:00 AM. You've already taken today's morning dose! ✅",
             "MEDICATION"},
            {"Can you tell me a story? I feel lonely.",
             "Of course! Did you know that in Vietnam, there's a legend about the origins of bánh chưng and bánh dày? The 6th Hùng King...",
             "GENERAL"},
            {"Thank you. That was a nice story.",
             "I'm glad you enjoyed it! What would you like to talk about next? Your family or maybe a memory from your youth?",
             "GENERAL"}
        };

        String sessionId = "default-" + e1.getId();
        for (String[] convo : convos) {
            ChatMessage userMsg = ChatMessage.builder()
                .user(e1).role(ChatMessage.ChatRole.USER)
                .content(convo[0]).sessionId(sessionId).build();
            chatMessageRepository.save(userMsg);

            ChatMessage aiMsg = ChatMessage.builder()
                .user(e1).role(ChatMessage.ChatRole.AI)
                .content(convo[1]).intent(convo[2])
                .sessionId(sessionId).build();
            chatMessageRepository.save(aiMsg);
        }
        log.info("Chat messages seeded ({} pairs).", convos.length);
    }

    // ── New: Subscription Seed ───────────────────────────────────────────

    private void seedSubscriptions() {
        log.info("Seeding subscriptions...");
        User family1 = familyUsers.get(0);

        Subscription sub = Subscription.builder()
            .user(family1)
            .planType(Subscription.PlanType.PREMIUM_MONTHLY)
            .status(Subscription.SubscriptionStatus.ACTIVE)
            .paymentProvider("MANUAL")
            .amount(new BigDecimal("49000"))
            .startDate(java.time.Instant.now().minus(5, java.time.temporal.ChronoUnit.DAYS))
            .endDate(java.time.Instant.now().plus(25, java.time.temporal.ChronoUnit.DAYS))
            .build();
        subscriptionRepository.save(sub);
        log.info("Subscription seeded (1 premium user).");
    }

    // ── New: Camera Seed ─────────────────────────────────────────────────

    private void seedCameras() {
        log.info("Seeding camera devices...");
        User e1 = elderlyUsers.get(0);

        CameraDevice camera = CameraDevice.builder()
            .elderly(e1)
            .label("Living Room")
            .deviceSn("IMOU-DEMO-001")
            .deviceId("demo-device-001")
            .status(CameraDevice.CameraStatus.ONLINE)
            .lastSeenAt(java.time.Instant.now())
            .motionDetectionEnabled(true)
            .monitoringWindowStart("07:00")
            .monitoringWindowEnd("09:00")
            .snapshotSchedule("08:00,13:00,20:00")
            .build();
        cameraDeviceRepository.save(camera);
        log.info("Camera device seeded (1 demo device).");
    }
}