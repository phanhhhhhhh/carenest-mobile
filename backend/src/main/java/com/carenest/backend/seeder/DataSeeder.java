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
import com.carenest.backend.repository.AppointmentRepository;
import com.carenest.backend.repository.ElderlyProfileRepository;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.HealthMetricRepository;
import com.carenest.backend.repository.MedicationLogRepository;
import com.carenest.backend.repository.MedicationRepository;
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
        log.info("Seed data created successfully.");
    }

    private void seedUsers() {
        log.info("Seeding users...");

        User e1 = saveUser("Nguyễn Văn An",  "+84912345001", LocalDate.of(1948, 3, 15),  UserRole.ELDERLY);
        User e2 = saveUser("Trần Thị Bình",   "+84912345002", LocalDate.of(1945, 7, 22),  UserRole.ELDERLY);
        User e3 = saveUser("Lê Văn Cường",    "+84912345003", LocalDate.of(1950, 11, 8),  UserRole.ELDERLY);
        User e4 = saveUser("Phạm Thị Dung",   "+84912345004", LocalDate.of(1943, 1, 30),  UserRole.ELDERLY);
        User e5 = saveUser("Hoàng Văn Em",    "+84912345005", LocalDate.of(1952, 9, 12),  UserRole.ELDERLY);

        elderlyUsers.addAll(List.of(e1, e2, e3, e4, e5));

        saveElderlyProfile(e1,
            List.of("Tiểu đường type 2", "Tăng huyết áp"),
            List.of(EmergencyContact.builder()
                .name("Nguyễn Thị Lan").phone("0912111001").relationship("Con gái").build()));

        saveElderlyProfile(e2,
            List.of("Suy tim độ II", "Rung nhĩ"),
            List.of(EmergencyContact.builder()
                .name("Trần Văn Minh").phone("0912111002").relationship("Con trai").build()));

        saveElderlyProfile(e3,
            List.of("COPD", "Thoái hóa khớp gối"),
            List.of(EmergencyContact.builder()
                .name("Lê Thị Hoa").phone("0912111003").relationship("Vợ").build()));

        saveElderlyProfile(e4,
            List.of("Alzheimer giai đoạn đầu", "Loãng xương"),
            List.of(EmergencyContact.builder()
                .name("Phạm Văn Đức").phone("0912111004").relationship("Con trai").build()));

        saveElderlyProfile(e5,
            List.of("Parkinson giai đoạn 2", "Trầm cảm"),
            List.of(EmergencyContact.builder()
                .name("Hoàng Thị Phương").phone("0912111005").relationship("Con gái").build()));

        User f1  = saveUser("Nguyễn Thị Lan",  "+84918111001", null, UserRole.FAMILY);
        User f2  = saveUser("Trần Văn Minh",    "+84918111002", null, UserRole.FAMILY);
        User f3  = saveUser("Lê Thị Hoa",       "+84918111003", null, UserRole.FAMILY);
        User f4  = saveUser("Phạm Văn Đức",     "+84918111004", null, UserRole.FAMILY);
        User f5  = saveUser("Hoàng Thị Phương", "+84918111005", null, UserRole.FAMILY);
        User f6  = saveUser("Vũ Thị Mai",       "+84918111006", null, UserRole.FAMILY);
        User f7  = saveUser("Đặng Văn Nam",     "+84918111007", null, UserRole.FAMILY);
        User f8  = saveUser("Bùi Thị Oanh",     "+84918111008", null, UserRole.FAMILY);
        User f9  = saveUser("Đỗ Văn Phong",     "+84918111009", null, UserRole.FAMILY);
        User f10 = saveUser("Ngô Thị Quỳnh",    "+84918111010", null, UserRole.FAMILY);

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
            schedule("TWICE_DAILY", "07:30", "19:30"), "Uống sau ăn",
            nextDoseFromNow(now, 12)));

        medications.add(saveMedication(e1, "Amlodipine", "5mg",
            schedule("DAILY", "08:00"), "Uống buổi sáng",
            nextDoseFromNow(now, 24)));

        medications.add(saveMedication(e1, "Aspirin", "81mg",
            schedule("DAILY", "08:00"), "Uống sau ăn sáng",
            nextDoseFromNow(now, 24)));

        medications.add(saveMedication(e2, "Furosemide", "40mg",
            schedule("DAILY", "07:00"), "Theo dõi phù chi",
            nextDoseFromNow(now, 24)));

        medications.add(saveMedication(e2, "Bisoprolol", "2.5mg",
            schedule("DAILY", "08:00"), "Không ngừng đột ngột",
            nextDoseFromNow(now, 24)));

        medications.add(saveMedication(e2, "Warfarin", "5mg",
            schedule("DAILY", "18:00"), "Theo dõi INR định kỳ",
            nextDoseFromNow(now, 8)));

        medications.add(saveMedication(e3, "Salbutamol inhaler", "100mcg/liều",
            scheduleAsNeeded(), "Dùng khi khó thở",
            null));

        medications.add(saveMedication(e3, "Tiotropium inhaler", "18mcg/liều",
            schedule("DAILY", "08:00"), "Hít buổi sáng",
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
                "Tái khám Nội tiết",
                "BS. Nguyễn Minh Hoàng",
                "Nội tiết - Đái tháo đường",
                "Bệnh viện Chợ Rẫy",
                now.plusWeeks(2).withHour(9).withMinute(0).withSecond(0).withNano(0));

            saveAppointment(elderly,
                "Xét nghiệm máu định kỳ",
                "BS. Trần Thị Hương",
                "Xét nghiệm",
                "Lab Medlatec",
                now.plusWeeks(3).withHour(7).withMinute(30).withSecond(0).withNano(0));

            saveAppointment(elderly,
                "Khám tim mạch",
                "BS. Lê Văn Phúc",
                "Tim mạch",
                "Viện Tim TP.HCM",
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
}