package com.carenest.backend.repository;

import com.carenest.backend.entity.Medication;
import com.carenest.backend.entity.MedicationSchedule;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class MedicationRepositoryTest extends BaseRepositoryTest {

    @Autowired
    private MedicationRepository medicationRepository;

    @Autowired
    private UserRepository userRepository;

    private User createElderlyUser(String phone) {
        return userRepository.save(User.builder()
                .role(UserRole.ELDERLY)
                .phone(phone)
                .name("Test Elderly")
                .build());
    }

    private Medication createMedication(User elderly, OffsetDateTime nextDoseTime) {
        return medicationRepository.save(Medication.builder()
                .elderly(elderly)
                .name("Paracetamol")
                .dosage("500mg")
                .nextDoseTime(nextDoseTime)
                .instructions("After meals")
                .build());
    }

    @Test
    void findAllOverdueMedications_returnsOnlyOverdueAndNotDeleted() {
        User elderly = createElderlyUser("0902000001");
        OffsetDateTime now = OffsetDateTime.now();

        Medication overdue = createMedication(elderly, now.minusHours(1));

        createMedication(elderly, now.plusHours(1));

        List<Medication> results = medicationRepository.findAllOverdueMedications(now);

        assertThat(results).extracting(m -> m.getId()).contains(overdue.getId());
        assertThat(results).allMatch(m -> !m.getNextDoseTime().isAfter(now));
    }

    @Test
    void findAllOverdueMedications_excludesSoftDeleted() {
        User elderly = createElderlyUser("0902000002");
        OffsetDateTime now = OffsetDateTime.now();

        Medication overdue = createMedication(elderly, now.minusHours(2));
        overdue.setDeletedAt(now.minusMinutes(30));
        medicationRepository.save(overdue);
        medicationRepository.flush();

        List<Medication> results = medicationRepository.findAllOverdueMedications(now);

        assertThat(results).extracting(m -> m.getId()).doesNotContain(overdue.getId());
    }

    @Test
    void findAllOverdueMedications_returnsEmptyWhenNoneOverdue() {
        User elderly = createElderlyUser("0902000003");
        OffsetDateTime now = OffsetDateTime.now();

        createMedication(elderly, now.plusHours(3));

        List<Medication> results = medicationRepository.findAllOverdueMedications(now);

        assertThat(results).isEmpty();
    }

    @Test
    void findUpcomingByElderlyId_returnsOnlyWithinTimeWindow() {
        User elderly = createElderlyUser("0902000004");
        OffsetDateTime now = OffsetDateTime.now();
        OffsetDateTime from = now.minusMinutes(10);
        OffsetDateTime to = now.plusHours(2);

        Medication inside = createMedication(elderly, now.plusHours(1));

        createMedication(elderly, now.plusHours(5));

        createMedication(elderly, now.minusHours(1));

        List<Medication> results = medicationRepository.findUpcomingByElderlyId(elderly.getId(), from, to);

        assertThat(results).extracting(m -> m.getId()).containsExactly(inside.getId());
    }

    @Test
    void findUpcomingByElderlyId_doesNotReturnOtherElderlyMedications() {
        User elderly1 = createElderlyUser("0902000005");
        User elderly2 = createElderlyUser("0902000006");
        OffsetDateTime now = OffsetDateTime.now();

        createMedication(elderly2, now.plusMinutes(30));

        List<Medication> results = medicationRepository.findUpcomingByElderlyId(
                elderly1.getId(), now.minusMinutes(5), now.plusHours(1));

        assertThat(results).isEmpty();
    }

    @Test
    void schedule_jsonbSerializesAndDeserializesCorrectly() {
        User elderly = createElderlyUser("0902000007");

        MedicationSchedule schedule = MedicationSchedule.builder()
                .frequency("TWICE_DAILY")
                .times(List.of("08:00", "20:00"))
                .daysOfWeek(null)
                .build();

        Medication saved = medicationRepository.save(Medication.builder()
                .elderly(elderly)
                .name("Aspirin")
                .dosage("100mg")
                .schedule(schedule)
                .nextDoseTime(OffsetDateTime.now().plusHours(1))
                .build());

        medicationRepository.flush();

        Medication reloaded = medicationRepository.findById(saved.getId()).orElseThrow();

        assertThat(reloaded.getSchedule()).isNotNull();
        assertThat(reloaded.getSchedule().getFrequency()).isEqualTo("TWICE_DAILY");
        assertThat(reloaded.getSchedule().getTimes()).containsExactly("08:00", "20:00");
        assertThat(reloaded.getSchedule().getDaysOfWeek()).isNull();
    }
}