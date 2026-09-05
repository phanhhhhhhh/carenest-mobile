package com.carenest.backend.seeder;

import com.carenest.backend.entity.Appointment;
import com.carenest.backend.entity.AppointmentStatus;
import com.carenest.backend.entity.ElderlyProfile;
import com.carenest.backend.entity.EmergencyContact;
import com.carenest.backend.entity.FamilyLink;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.HealthMetric;
import com.carenest.backend.entity.HealthMetricThreshold;
import com.carenest.backend.entity.HealthMetricType;
import com.carenest.backend.entity.Medication;
import com.carenest.backend.entity.MedicationLog;
import com.carenest.backend.entity.MedicationLogStatus;
import com.carenest.backend.entity.MedicationSchedule;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.entity.CameraDevice;
import com.carenest.backend.entity.CameraSnapshot;
import com.carenest.backend.entity.ChatMessage;
import com.carenest.backend.entity.CheckIn;
import com.carenest.backend.entity.CheckInSource;
import com.carenest.backend.entity.EmergencyEvent;
import com.carenest.backend.entity.EmergencyStatus;
import com.carenest.backend.entity.Subscription;
import com.carenest.backend.repository.AppointmentRepository;
import com.carenest.backend.repository.CameraDeviceRepository;
import com.carenest.backend.repository.CameraSnapshotRepository;
import com.carenest.backend.repository.ChatMessageRepository;
import com.carenest.backend.repository.CheckInRepository;
import com.carenest.backend.repository.ElderlyProfileRepository;
import com.carenest.backend.repository.EmergencyEventRepository;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.HealthMetricRepository;
import com.carenest.backend.repository.HealthMetricThresholdRepository;
import com.carenest.backend.repository.MedicationLogRepository;
import com.carenest.backend.repository.MedicationRepository;
import com.carenest.backend.repository.SubscriptionRepository;
import com.carenest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    @Value("${carenest.seed.enabled:false}")
    private boolean seedEnabled;

    // Demo login password for all seeded accounts — see README "Demo Data" section.
    private static final String DEMO_PASSWORD = "Demo@1234";
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    private final UserRepository userRepository;
    private final ElderlyProfileRepository elderlyProfileRepository;
    private final FamilyLinkRepository familyLinkRepository;
    private final MedicationRepository medicationRepository;
    private final MedicationLogRepository medicationLogRepository;
    private final HealthMetricRepository healthMetricRepository;
    private final HealthMetricThresholdRepository healthMetricThresholdRepository;
    private final AppointmentRepository appointmentRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final SubscriptionRepository subscriptionRepository;
    private final CameraDeviceRepository cameraDeviceRepository;
    private final EmergencyEventRepository emergencyEventRepository;
    private final CameraSnapshotRepository cameraSnapshotRepository;
    private final CheckInRepository checkInRepository;

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
        seedCheckIns();
        seedHealthMetricThresholds();
        seedAppointments();
        seedChatMessages();
        seedSubscriptions();
        CameraDevice demoCamera = seedCameras();
        seedEmergencyEvent(demoCamera);
        log.info("Seed data created successfully.");
    }

    private void seedUsers() {
        log.info("Seeding users...");

        User e1 = saveUser("John Anderson",  "+84912345001", "john.anderson@test.com",   LocalDate.of(1948, 3, 15),  UserRole.ELDERLY);
        User e2 = saveUser("Jane Thompson",   "+84912345002", "jane.thompson@test.com",  LocalDate.of(1945, 7, 22),  UserRole.ELDERLY);
        User e3 = saveUser("Robert Lee",    "+84912345003", "robert.lee@test.com",     LocalDate.of(1950, 11, 8),  UserRole.ELDERLY);
        User e4 = saveUser("Mary Pham",   "+84912345004", "mary.pham@test.com",      LocalDate.of(1943, 1, 30),  UserRole.ELDERLY);
        User e5 = saveUser("William Hoang",    "+84912345005", "william.hoang@test.com",  LocalDate.of(1952, 9, 12),  UserRole.ELDERLY);

        elderlyUsers.addAll(List.of(e1, e2, e3, e4, e5));

        saveElderlyProfile(e1,
            List.of("Tiểu đường Tuýp 2", "Tăng huyết áp"),
            List.of(EmergencyContact.builder()
                .name("Linda Nguyen").phone("0912111001").relationship("Con gái").build()));

        saveElderlyProfile(e2,
            List.of("Suy tim độ II", "Rung nhĩ"),
            List.of(EmergencyContact.builder()
                .name("Michael Tran").phone("0912111002").relationship("Con trai").build()));

        saveElderlyProfile(e3,
            List.of("Bệnh phổi tắc nghẽn mạn tính (COPD)", "Thoái hóa khớp gối"),
            List.of(EmergencyContact.builder()
                .name("Sarah Le").phone("0912111003").relationship("Vợ").build()));

        saveElderlyProfile(e4,
            List.of("Alzheimer giai đoạn đầu", "Loãng xương"),
            List.of(EmergencyContact.builder()
                .name("David Pham").phone("0912111004").relationship("Con trai").build()));

        saveElderlyProfile(e5,
            List.of("Parkinson giai đoạn 2", "Trầm cảm"),
            List.of(EmergencyContact.builder()
                .name("Emily Hoang").phone("0912111005").relationship("Con gái").build()));

        User f1  = saveUser("Linda Nguyen",  "+84918111001", "linda.nguyen@test.com",  null, UserRole.FAMILY);
        User f2  = saveUser("Michael Tran",    "+84918111002", "michael.tran@test.com",   null, UserRole.FAMILY);
        User f3  = saveUser("Sarah Le",       "+84918111003", "sarah.le@test.com",      null, UserRole.FAMILY);
        User f4  = saveUser("David Pham",     "+84918111004", "david.pham@test.com",    null, UserRole.FAMILY);
        User f5  = saveUser("Emily Hoang", "+84918111005", "emily.hoang@test.com",   null, UserRole.FAMILY);
        User f6  = saveUser("Anna Vu",       "+84918111006", "anna.vu@test.com",       null, UserRole.FAMILY);
        User f7  = saveUser("Nathan Dang",     "+84918111007", "nathan.dang@test.com",    null, UserRole.FAMILY);
        User f8  = saveUser("Olivia Bui",     "+84918111008", "olivia.bui@test.com",    null, UserRole.FAMILY);
        User f9  = saveUser("Peter Do",     "+84918111009", "peter.do@test.com",      null, UserRole.FAMILY);
        User f10 = saveUser("Quinn Ngo",    "+84918111010", "quinn.ngo@test.com",     null, UserRole.FAMILY);

        familyUsers.addAll(List.of(f1, f2, f3, f4, f5, f6, f7, f8, f9, f10));

        saveFamilyLink(e1, f1, "Con gái");
        saveFamilyLink(e2, f2, "Con trai");
        saveFamilyLink(e3, f3, "Vợ");
        saveFamilyLink(e4, f4, "Con trai");
        saveFamilyLink(e5, f5, "Con gái");

        saveFamilyLink(e1, f6,  "Người thân");
        saveFamilyLink(e1, f7,  "Người thân");
        saveFamilyLink(e1, f8,  "Người thân");
        saveFamilyLink(e2, f9,  "Người thân");
        saveFamilyLink(e2, f10, "Người thân");

        log.info("Seeded {} elderly + {} family users.", elderlyUsers.size(), familyUsers.size());
    }

    private User saveUser(String name, String phone, String email, LocalDate dob, UserRole role) {
        User user = User.builder()
            .name(name)
            .phone(phone)
            .email(email)
            .emailVerified(true)
            .passwordHash(passwordEncoder.encode(DEMO_PASSWORD))
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
            schedule("TWICE_DAILY", "07:30", "19:30"), "Uống sau bữa ăn",
            nextDoseFromNow(now, 12)));

        medications.add(saveMedication(e1, "Amlodipine", "5mg",
            schedule("DAILY", "08:00"), "Uống vào buổi sáng",
            nextDoseFromNow(now, 24)));

        medications.add(saveMedication(e1, "Aspirin", "81mg",
            schedule("DAILY", "08:00"), "Uống sau bữa sáng",
            nextDoseFromNow(now, 24)));

        medications.add(saveMedication(e2, "Furosemide", "40mg",
            schedule("DAILY", "07:00"), "Theo dõi dấu hiệu phù nề",
            nextDoseFromNow(now, 24)));

        medications.add(saveMedication(e2, "Bisoprolol", "2.5mg",
            schedule("DAILY", "08:00"), "Không tự ý ngừng thuốc đột ngột",
            nextDoseFromNow(now, 24)));

        medications.add(saveMedication(e2, "Warfarin", "5mg",
            schedule("DAILY", "18:00"), "Theo dõi chỉ số INR thường xuyên",
            nextDoseFromNow(now, 8)));

        medications.add(saveMedication(e3, "Ống hít Salbutamol", "100mcg/liều",
            scheduleAsNeeded(), "Dùng khi khó thở",
            null));

        medications.add(saveMedication(e3, "Ống hít Tiotropium", "18mcg/liều",
            schedule("DAILY", "08:00"), "Hít vào buổi sáng",
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

    /** Daily 1-touch check-ins (UC A1) — 14 days of history for the first two elderly. */
    private void seedCheckIns() {
        log.info("Seeding daily check-ins (14 days)...");

        User e1 = elderlyUsers.get(0);
        User e2 = elderlyUsers.get(1);
        OffsetDateTime reference = OffsetDateTime.now();

        // mood cycle: mostly good, an occasional "unwell" day — never 4 (that path fires SOS)
        short[] e1Moods = {1, 1, 2, 1, 1, 3, 1, 2, 1, 1, 1, 2, 1, 1};
        short[] e2Moods = {1, 2, 1, 1, 2, 1, 1, 1, 3, 1, 2, 1, 1, 1};

        for (int day = 13; day >= 0; day--) {
            OffsetDateTime at = reference.minusDays(day).withHour(7).withMinute(30).withSecond(0).withNano(0);
            saveCheckIn(e1, e1Moods[13 - day], at);
            saveCheckIn(e2, e2Moods[13 - day], at.plusMinutes(20));
        }

        log.info("Check-ins seeded.");
    }

    private void saveCheckIn(User elderly, short mood, OffsetDateTime at) {
        checkInRepository.save(CheckIn.builder()
            .elderly(elderly)
            .mood(mood)
            .source(CheckInSource.BUTTON)
            .createdAt(at)
            .build());
    }

    private void seedHealthMetricThresholds() {
        log.info("Seeding health metric thresholds...");
        User e1 = elderlyUsers.get(0);

        // Seeded BP history for e1 stays in a tight 130-138 band (see seedHealthMetrics),
        // so a live reading anywhere near 175 breaches this deterministically — the
        // reliable trigger for the demo's health-anomaly-alert walkthrough, independent
        // of the statistical (IQR/z-score) detector's sensitivity to the exact history.
        healthMetricThresholdRepository.save(HealthMetricThreshold.builder()
            .elderly(e1)
            .metricType(HealthMetricType.BLOOD_PRESSURE)
            .minValue(new BigDecimal("90"))
            .maxValue(new BigDecimal("140"))
            .minValueSecondary(new BigDecimal("60"))
            .maxValueSecondary(new BigDecimal("90"))
            .alertFamily(true)
            .build());

        healthMetricThresholdRepository.save(HealthMetricThreshold.builder()
            .elderly(e1)
            .metricType(HealthMetricType.HEART_RATE)
            .minValue(new BigDecimal("50"))
            .maxValue(new BigDecimal("110"))
            .alertFamily(true)
            .build());

        log.info("Health metric thresholds seeded.");
    }

    private void seedAppointments() {
        log.info("Seeding appointments...");

        OffsetDateTime now = OffsetDateTime.now();

        for (User elderly : elderlyUsers) {

            saveAppointment(elderly,
                "Tái khám nội tiết",
                "BS. Michael Nguyen",
                "Nội tiết - Tiểu đường",
                "Bệnh viện Đa khoa Thành phố",
                now.plusWeeks(2).withHour(9).withMinute(0).withSecond(0).withNano(0));

            saveAppointment(elderly,
                "Xét nghiệm máu định kỳ",
                "BS. Hannah Tran",
                "Xét nghiệm",
                "Phòng khám Medlatec",
                now.plusWeeks(3).withHour(7).withMinute(30).withSecond(0).withNano(0));

            saveAppointment(elderly,
                "Khám tim mạch",
                "BS. Felix Le",
                "Tim mạch",
                "Viện Tim mạch",
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


    private void seedChatMessages() {
        log.info("Seeding chat messages...");
        User e1 = elderlyUsers.get(0);

        String[][] convos = {
            {"Chào buổi sáng! Hôm nay ông cảm thấy thế nào?",
             "Tôi hơi mệt. Lưng tôi đau.",
             "HEALTH"},
            {"Mấy giờ tôi uống thuốc huyết áp vậy?",
             "Amlodipine 5mg của ông được lên lịch lúc 8:00 sáng. Ông đã uống liều sáng nay rồi đó! ✅",
             "MEDICATION"},
            {"Kể cho tôi một câu chuyện được không? Tôi thấy cô đơn quá.",
             "Được chứ! Ông có biết ở Việt Nam có truyền thuyết về nguồn gốc bánh chưng và bánh dày không? Vua Hùng thứ 6...",
             "GENERAL"},
            {"Cảm ơn nhé. Câu chuyện hay đấy.",
             "Tôi rất vui vì ông thích! Ông muốn trò chuyện tiếp về điều gì? Gia đình của ông, hay một kỷ niệm thời trẻ chẳng hạn?",
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


    private void seedSubscriptions() {
        log.info("Seeding subscriptions...");
        User family1 = familyUsers.get(0);

        Subscription sub = Subscription.builder()
            .user(family1)
            .planType(Subscription.PlanType.PREMIUM_MONTHLY)
            .status(Subscription.SubscriptionStatus.ACTIVE)
            .paymentProvider("MANUAL")
            .amount(new BigDecimal("49000"))
            .startDate(Instant.now().minus(5, ChronoUnit.DAYS))
            .endDate(Instant.now().plus(25, ChronoUnit.DAYS))
            .build();
        subscriptionRepository.save(sub);
        log.info("Subscription seeded (1 premium user).");
    }


    private CameraDevice seedCameras() {
        log.info("Seeding camera devices...");
        User e1 = elderlyUsers.get(0);

        CameraDevice camera = CameraDevice.builder()
            .elderly(e1)
            .label("Phòng khách")
            .deviceSn("IMOU-DEMO-001")
            .deviceId("demo-device-001")
            .status(CameraDevice.CameraStatus.ONLINE)
            .lastSeenAt(Instant.now())
            .motionDetectionEnabled(true)
            .monitoringWindowStart("07:00")
            .monitoringWindowEnd("09:00")
            .snapshotSchedule("08:00,13:00,20:00")
            .build();
        cameraDeviceRepository.save(camera);
        log.info("Camera device seeded (1 demo device).");
        return camera;
    }

    private void seedEmergencyEvent(CameraDevice camera) {
        log.info("Seeding a past resolved SOS event...");
        User e1 = elderlyUsers.get(0);
        User f1 = familyUsers.get(0);

        OffsetDateTime triggeredAt = OffsetDateTime.now().minusDays(4).withHour(21).withMinute(12).withSecond(0).withNano(0);

        EmergencyEvent event = EmergencyEvent.builder()
            .elderly(e1)
            .latitude(new BigDecimal("10.7769000"))
            .longitude(new BigDecimal("106.7009000"))
            .address("123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh")
            .status(EmergencyStatus.RESOLVED)
            .triggeredAt(triggeredAt)
            .acknowledgedAt(triggeredAt.plusMinutes(2))
            .acknowledgedBy(f1.getId())
            .resolvedAt(triggeredAt.plusMinutes(18))
            .notes("Báo động giả — bấm nhầm nút, đã xác nhận ổn qua điện thoại.")
            .build();
        event = emergencyEventRepository.save(event);

        CameraSnapshot snapshot = CameraSnapshot.builder()
            .camera(camera)
            .elderly(e1)
            .imageUrl("https://picsum.photos/seed/carenest-sos-demo/640/480")
            .trigger(CameraSnapshot.SnapshotTrigger.SOS)
            .emergencyEventId(event.getId())
            .success(true)
            .build();
        cameraSnapshotRepository.save(snapshot);

        log.info("Emergency event + SOS snapshot seeded.");
    }
}