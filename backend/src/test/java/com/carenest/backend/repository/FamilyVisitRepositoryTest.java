package com.carenest.backend.repository;

import com.carenest.backend.entity.FamilyVisit;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceUnitUtil;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class FamilyVisitRepositoryTest extends BaseRepositoryTest {

    private static final ZoneId ICT = ZoneId.of("Asia/Ho_Chi_Minh");

    @Autowired private FamilyVisitRepository visitRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private EntityManager entityManager;

    @Test
    void calculationHistoryIsTimestampOnlyWhileRecentHistoryIsBoundedAndFetchesMember() {
        User elderly = saveUser("0907000001", UserRole.ELDERLY, "Elderly");
        User firstMember = saveUser("0907000002", UserRole.FAMILY, "First member");
        User secondMember = saveUser("0907000003", UserRole.FAMILY, "Second member");
        OffsetDateTime base = OffsetDateTime.of(2026, 1, 1, 10, 0, 0, 0, ZoneOffset.UTC);
        List<FamilyVisit> visits = new ArrayList<>();
        for (int i = 0; i < 25; i++) {
            visits.add(FamilyVisit.builder()
                .elderly(elderly)
                .member(i % 2 == 0 ? firstMember : secondMember)
                .visitedAt(base.plusDays(i))
                .build());
        }
        visitRepository.saveAllAndFlush(visits);
        entityManager.clear();

        List<OffsetDateTime> timestamps =
            visitRepository.findVisitTimestampsByElderlyId(elderly.getId());
        List<FamilyVisit> recent = visitRepository.findRecentByElderlyId(
            elderly.getId(), PageRequest.of(0, 20));

        assertThat(timestamps).hasSize(25).isSorted();
        assertThat(recent).hasSize(20);
        assertThat(recent).extracting(FamilyVisit::getVisitedAt).isSortedAccordingTo(
            java.util.Comparator.reverseOrder());
        PersistenceUnitUtil persistence = entityManager.getEntityManagerFactory()
            .getPersistenceUnitUtil();
        assertThat(persistence.isLoaded(recent.get(0), "member")).isTrue();
    }

    @Test
    void duplicateExistenceQueryScopesByElderlyMemberAndUsesExclusiveEnd() {
        User elderly = saveUser("0907100001", UserRole.ELDERLY, "Elderly");
        User otherElderly = saveUser("0907100002", UserRole.ELDERLY, "Other elderly");
        User member = saveUser("0907100003", UserRole.FAMILY, "Member");
        User otherMember = saveUser("0907100004", UserRole.FAMILY, "Other member");
        OffsetDateTime start = java.time.LocalDate.of(2026, 9, 14)
            .atStartOfDay(ICT).toOffsetDateTime();
        OffsetDateTime end = start.plusDays(1);
        visitRepository.saveAllAndFlush(List.of(
            visit(elderly, member, start),
            visit(elderly, member, end),
            visit(elderly, otherMember, start.plusHours(2)),
            visit(otherElderly, member, start.plusHours(3))));

        assertThat(exists(elderly, member, start, end)).isTrue();
        assertThat(exists(elderly, member, start.plusMinutes(1), end)).isFalse();
        assertThat(exists(elderly, member, end, end.plusDays(1))).isTrue();
        assertThat(exists(elderly, otherMember, end, end.plusDays(1))).isFalse();
        assertThat(exists(otherElderly, member, end, end.plusDays(1))).isFalse();
    }

    @Test
    void utcInstantsAreComparedByIctCalendarDate() {
        User elderly = saveUser("0907200001", UserRole.ELDERLY, "Elderly");
        User member = saveUser("0907200002", UserRole.FAMILY, "Member");
        visitRepository.saveAndFlush(visit(
            elderly, member, OffsetDateTime.parse("2026-09-13T16:00:00Z")));

        OffsetDateTime september13Start = java.time.LocalDate.of(2026, 9, 13)
            .atStartOfDay(ICT).toOffsetDateTime();
        OffsetDateTime september14Start = september13Start.plusDays(1);

        assertThat(exists(elderly, member, september13Start, september14Start)).isTrue();
        assertThat(exists(elderly, member, september14Start, september14Start.plusDays(1)))
            .isFalse();
    }

    private boolean exists(User elderly, User member, OffsetDateTime start, OffsetDateTime end) {
        return visitRepository
            .existsByElderlyIdAndMemberIdAndVisitedAtGreaterThanEqualAndVisitedAtLessThan(
                elderly.getId(), member.getId(), start, end);
    }

    private FamilyVisit visit(User elderly, User member, OffsetDateTime visitedAt) {
        return FamilyVisit.builder()
            .elderly(elderly)
            .member(member)
            .visitedAt(visitedAt)
            .build();
    }

    private User saveUser(String phone, UserRole role, String name) {
        return userRepository.save(User.builder()
            .phone(phone)
            .role(role)
            .name(name)
            .notificationPreferences(null)
            .build());
    }
}
