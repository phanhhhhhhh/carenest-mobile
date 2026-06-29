package com.carenest.backend.repository;

import com.carenest.backend.entity.Appointment;
import com.carenest.backend.entity.AppointmentStatus;
import com.carenest.backend.entity.FamilyLink;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class AppointmentRepositoryTest extends BaseRepositoryTest {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private FamilyLinkRepository familyLinkRepository;

    private User createElderlyUser(String phone) {
        return userRepository.save(User.builder()
                .role(UserRole.ELDERLY)
                .phone(phone)
                .name("Test Elderly")
                .build());
    }

    private User createFamilyUser(String phone) {
        return userRepository.save(User.builder()
                .role(UserRole.FAMILY)
                .phone(phone)
                .name("Test Family")
                .build());
    }

    private Appointment createAppointment(User elderly, OffsetDateTime datetime) {
        return appointmentRepository.save(Appointment.builder()
                .elderly(elderly)
                .doctor("Dr. Nguyen")
                .specialty("Cardiology")
                .location("Hospital A")
                .datetime(datetime)
                .status(AppointmentStatus.SCHEDULED)
                .build());
    }

    private void linkFamilyToElderly(User elderly, User family) {
        familyLinkRepository.save(FamilyLink.builder()
                .elderly(elderly)
                .family(family)
                .relationship("Son")
                .status(FamilyLinkStatus.ACTIVE)
                .build());
    }

    @Test
    void findByElderlyIdAndDatetimeBetween_returnsCorrectRecordsOrderedAsc() {
        User elderly = createElderlyUser("0905000001");
        OffsetDateTime base = OffsetDateTime.now();

        Appointment first  = createAppointment(elderly, base.plusHours(1));
        Appointment second = createAppointment(elderly, base.plusHours(3));
        Appointment third  = createAppointment(elderly, base.plusHours(5));

        createAppointment(elderly, base.plusDays(10));

        List<Appointment> results = appointmentRepository
                .findByElderlyIdAndDatetimeBetweenAndDeletedAtIsNullOrderByDatetimeAsc(
                        elderly.getId(), base, base.plusHours(6));

        assertThat(results).extracting(Appointment::getId)
                .containsExactly(first.getId(), second.getId(), third.getId());
    }

    @Test
    void findByElderlyIdAndDatetimeBetween_excludesOtherElderly() {
        User elderly1 = createElderlyUser("0905000002");
        User elderly2 = createElderlyUser("0905000003");
        OffsetDateTime base = OffsetDateTime.now();

        createAppointment(elderly2, base.plusHours(1));

        List<Appointment> results = appointmentRepository
                .findByElderlyIdAndDatetimeBetweenAndDeletedAtIsNullOrderByDatetimeAsc(
                        elderly1.getId(), base, base.plusHours(6));

        assertThat(results).isEmpty();
    }

    @Test
    void findByElderlyIdAndDatetimeBetween_excludesSoftDeleted() {
        User elderly = createElderlyUser("0905000004");
        OffsetDateTime base = OffsetDateTime.now();

        Appointment appointment = createAppointment(elderly, base.plusHours(2));
        appointment.setDeletedAt(OffsetDateTime.now());
        appointmentRepository.save(appointment);
        appointmentRepository.flush();

        List<Appointment> results = appointmentRepository
                .findByElderlyIdAndDatetimeBetweenAndDeletedAtIsNullOrderByDatetimeAsc(
                        elderly.getId(), base, base.plusHours(6));

        assertThat(results).extracting(Appointment::getId).doesNotContain(appointment.getId());
    }

    @Test
    void findUpcomingForFamilyMember_returnsAppointmentsForLinkedElderly() {
        User elderly = createElderlyUser("0905000005");
        User family = createFamilyUser("0905000006");
        linkFamilyToElderly(elderly, family);
        familyLinkRepository.flush();

        OffsetDateTime now = OffsetDateTime.now();
        Appointment upcoming = createAppointment(elderly, now.plusHours(2));

        createAppointment(elderly, now.minusHours(1));

        List<Appointment> results = appointmentRepository
                .findUpcomingForFamilyMember(family.getId(), now);

        assertThat(results).extracting(Appointment::getId).contains(upcoming.getId());
        assertThat(results).allMatch(a -> !a.getDatetime().isBefore(now));
    }

    @Test
    void findUpcomingForFamilyMember_excludesSoftDeletedAppointments() {
        User elderly = createElderlyUser("0905000007");
        User family = createFamilyUser("0905000008");
        linkFamilyToElderly(elderly, family);
        familyLinkRepository.flush();

        OffsetDateTime now = OffsetDateTime.now();
        Appointment appointment = createAppointment(elderly, now.plusHours(2));
        appointment.setDeletedAt(OffsetDateTime.now());
        appointmentRepository.save(appointment);
        appointmentRepository.flush();

        List<Appointment> results = appointmentRepository
                .findUpcomingForFamilyMember(family.getId(), now);

        assertThat(results).extracting(Appointment::getId).doesNotContain(appointment.getId());
    }

    @Test
    void findUpcomingForFamilyMember_returnsEmptyWhenNotLinked() {
        User elderly = createElderlyUser("0905000009");
        User family = createFamilyUser("0905000010");

        OffsetDateTime now = OffsetDateTime.now();

        createAppointment(elderly, now.plusHours(1));

        List<Appointment> results = appointmentRepository
                .findUpcomingForFamilyMember(family.getId(), now);

        assertThat(results).isEmpty();
    }

    @Test
    void findUpcomingForFamilyMember_excludesRevokedFamilyLinks() {
        User elderly = createElderlyUser("0905000011");
        User family = createFamilyUser("0905000012");

        familyLinkRepository.save(FamilyLink.builder()
                .elderly(elderly)
                .family(family)
                .relationship("Daughter")
                .status(FamilyLinkStatus.REVOKED)
                .build());
        familyLinkRepository.flush();

        OffsetDateTime now = OffsetDateTime.now();
        createAppointment(elderly, now.plusHours(1));

        List<Appointment> results = appointmentRepository
                .findUpcomingForFamilyMember(family.getId(), now);

        assertThat(results).isEmpty();
    }

    @Test
    void findUpcomingForFamilyMember_returnsOrderedByDatetimeAsc() {
        User elderly = createElderlyUser("0905000013");
        User family = createFamilyUser("0905000014");
        linkFamilyToElderly(elderly, family);
        familyLinkRepository.flush();

        OffsetDateTime now = OffsetDateTime.now();
        Appointment later  = createAppointment(elderly, now.plusHours(5));
        Appointment sooner = createAppointment(elderly, now.plusHours(1));

        List<Appointment> results = appointmentRepository
                .findUpcomingForFamilyMember(family.getId(), now);

        assertThat(results).extracting(Appointment::getId)
                .containsExactly(sooner.getId(), later.getId());
    }
}