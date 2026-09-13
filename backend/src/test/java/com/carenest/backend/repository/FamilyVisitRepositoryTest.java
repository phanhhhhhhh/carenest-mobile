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
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class FamilyVisitRepositoryTest extends BaseRepositoryTest {

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

    private User saveUser(String phone, UserRole role, String name) {
        return userRepository.save(User.builder()
            .phone(phone)
            .role(role)
            .name(name)
            .notificationPreferences(null)
            .build());
    }
}
