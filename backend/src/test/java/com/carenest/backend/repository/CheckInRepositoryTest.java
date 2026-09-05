package com.carenest.backend.repository;

import com.carenest.backend.entity.CheckIn;
import com.carenest.backend.entity.CheckInSource;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class CheckInRepositoryTest extends BaseRepositoryTest {

    @Autowired
    private CheckInRepository checkInRepository;

    @Autowired
    private UserRepository userRepository;

    private User createElderlyUser(String phone) {
        return userRepository.save(User.builder()
                .role(UserRole.ELDERLY)
                .phone(phone)
                .name("Test Elderly")
                .build());
    }

    private CheckIn createCheckIn(User elderly, int mood, OffsetDateTime createdAt) {
        return checkInRepository.saveAndFlush(CheckIn.builder()
                .elderly(elderly)
                .mood((short) mood)
                .source(CheckInSource.BUTTON)
                .createdAt(createdAt)
                .build());
    }

    @Test
    void findTopByElderlyIdOrderByCreatedAtDesc_returnsMostRecent() {
        User elderly = createElderlyUser("0904000001");
        OffsetDateTime base = OffsetDateTime.now();

        createCheckIn(elderly, 1, base.minusHours(5));
        CheckIn newest = createCheckIn(elderly, 3, base.minusHours(1));

        Optional<CheckIn> result = checkInRepository.findTopByElderlyIdOrderByCreatedAtDesc(elderly.getId());

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(newest.getId());
        assertThat(result.get().getMood()).isEqualTo((short) 3);
    }

    @Test
    void findByElderlyIdAndCreatedAtBetween_scopesToRange() {
        User elderly = createElderlyUser("0904000002");
        OffsetDateTime startOfDay = OffsetDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);

        createCheckIn(elderly, 2, startOfDay.minusHours(3));      // yesterday
        CheckIn today = createCheckIn(elderly, 1, startOfDay.plusHours(8));

        List<CheckIn> result = checkInRepository
                .findByElderlyIdAndCreatedAtBetweenOrderByCreatedAtDesc(
                        elderly.getId(), startOfDay, startOfDay.plusDays(1));

        assertThat(result).extracting(CheckIn::getId).containsExactly(today.getId());
    }

    @Test
    void findByElderlyIdOrderByCreatedAtDesc_isScopedPerElderly() {
        User a = createElderlyUser("0904000003");
        User b = createElderlyUser("0904000004");
        OffsetDateTime base = OffsetDateTime.now();

        createCheckIn(a, 1, base.minusHours(2));
        createCheckIn(b, 4, base.minusHours(1));

        List<CheckIn> result = checkInRepository.findByElderlyIdOrderByCreatedAtDesc(a.getId());

        assertThat(result).hasSize(1);
        assertThat(result.get(0).getElderly().getId()).isEqualTo(a.getId());
    }
}
