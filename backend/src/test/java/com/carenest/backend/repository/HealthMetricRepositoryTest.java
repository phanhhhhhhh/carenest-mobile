package com.carenest.backend.repository;

import com.carenest.backend.entity.HealthMetric;
import com.carenest.backend.entity.HealthMetricType;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@Transactional
class HealthMetricRepositoryTest extends BaseRepositoryTest {

    @Autowired
    private HealthMetricRepository healthMetricRepository;

    @Autowired
    private UserRepository userRepository;

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    private User createElderlyUser(String phone) {
        return userRepository.save(User.builder()
                .role(UserRole.ELDERLY)
                .phone(phone)
                .name("Test Elderly")
                .build());
    }

    private HealthMetric createMetric(User elderly, HealthMetricType type,
                                      BigDecimal value, OffsetDateTime recordedAt) {
        return healthMetricRepository.save(HealthMetric.builder()
                .elderly(elderly)
                .type(type)
                .value(value)
                .unit(type == HealthMetricType.HEART_RATE ? "bpm" : "mmHg")
                .recordedAt(recordedAt)
                .build());
    }

    // -----------------------------------------------------------------------
    // findByElderlyIdAndTypeAndRecordedAtBetweenAndDeletedAtIsNullOrderByRecordedAtDesc
    // -----------------------------------------------------------------------

    @Test
    void findByElderlyIdAndTypeAndRange_returnsCorrectRecordsOrderedDesc() {
        User elderly = createElderlyUser("0903000001");
        OffsetDateTime base = OffsetDateTime.now().minusDays(1);

        HealthMetric early = createMetric(elderly, HealthMetricType.HEART_RATE,
                BigDecimal.valueOf(70), base.minusHours(2));
        HealthMetric middle = createMetric(elderly, HealthMetricType.HEART_RATE,
                BigDecimal.valueOf(75), base);
        HealthMetric late = createMetric(elderly, HealthMetricType.HEART_RATE,
                BigDecimal.valueOf(80), base.plusHours(2));
        // Outside range — should NOT appear
        createMetric(elderly, HealthMetricType.HEART_RATE,
                BigDecimal.valueOf(90), base.plusDays(5));

        List<HealthMetric> results = healthMetricRepository
                .findByElderlyIdAndTypeAndRecordedAtBetweenAndDeletedAtIsNullOrderByRecordedAtDesc(
                        elderly.getId(), HealthMetricType.HEART_RATE,
                        base.minusHours(3), base.plusHours(3));

        assertThat(results).extracting(HealthMetric::getId)
                .containsExactly(late.getId(), middle.getId(), early.getId());
    }

    @Test
    void findByElderlyIdAndTypeAndRange_excludesDifferentType() {
        User elderly = createElderlyUser("0903000002");
        OffsetDateTime base = OffsetDateTime.now();

        createMetric(elderly, HealthMetricType.WEIGHT, BigDecimal.valueOf(65), base);

        List<HealthMetric> results = healthMetricRepository
                .findByElderlyIdAndTypeAndRecordedAtBetweenAndDeletedAtIsNullOrderByRecordedAtDesc(
                        elderly.getId(), HealthMetricType.HEART_RATE,
                        base.minusHours(1), base.plusHours(1));

        assertThat(results).isEmpty();
    }

    @Test
    void findByElderlyIdAndTypeAndRange_excludesSoftDeleted() {
        User elderly = createElderlyUser("0903000003");
        OffsetDateTime base = OffsetDateTime.now();

        HealthMetric metric = createMetric(elderly, HealthMetricType.HEART_RATE,
                BigDecimal.valueOf(72), base);
        metric.setDeletedAt(OffsetDateTime.now());
        healthMetricRepository.save(metric);
        healthMetricRepository.flush();

        List<HealthMetric> results = healthMetricRepository
                .findByElderlyIdAndTypeAndRecordedAtBetweenAndDeletedAtIsNullOrderByRecordedAtDesc(
                        elderly.getId(), HealthMetricType.HEART_RATE,
                        base.minusHours(1), base.plusHours(1));

        assertThat(results).extracting(HealthMetric::getId).doesNotContain(metric.getId());
    }

    // -----------------------------------------------------------------------
    // findLatestByElderlyIdAndType
    // -----------------------------------------------------------------------

    @Test
    void findLatestByElderlyIdAndType_returnsTheMostRecentRecord() {
        User elderly = createElderlyUser("0903000004");
        OffsetDateTime base = OffsetDateTime.now();

        createMetric(elderly, HealthMetricType.HEART_RATE, BigDecimal.valueOf(68), base.minusHours(3));
        createMetric(elderly, HealthMetricType.HEART_RATE, BigDecimal.valueOf(72), base.minusHours(1));
        HealthMetric newest = createMetric(elderly, HealthMetricType.HEART_RATE,
                BigDecimal.valueOf(78), base);

        Optional<HealthMetric> result = healthMetricRepository
                .findLatestByElderlyIdAndType(elderly.getId(), HealthMetricType.HEART_RATE);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(newest.getId());
    }

    @Test
    void findLatestByElderlyIdAndType_returnsEmptyWhenNoMetrics() {
        User elderly = createElderlyUser("0903000005");

        Optional<HealthMetric> result = healthMetricRepository
                .findLatestByElderlyIdAndType(elderly.getId(), HealthMetricType.HEART_RATE);

        assertThat(result).isEmpty();
    }

    @Test
    void findLatestByElderlyIdAndType_excludesSoftDeleted() {
        User elderly = createElderlyUser("0903000006");
        OffsetDateTime base = OffsetDateTime.now();

        HealthMetric older = createMetric(elderly, HealthMetricType.HEART_RATE,
                BigDecimal.valueOf(70), base.minusHours(2));
        HealthMetric newer = createMetric(elderly, HealthMetricType.HEART_RATE,
                BigDecimal.valueOf(80), base);
        newer.setDeletedAt(OffsetDateTime.now());
        healthMetricRepository.save(newer);
        healthMetricRepository.flush();

        Optional<HealthMetric> result = healthMetricRepository
                .findLatestByElderlyIdAndType(elderly.getId(), HealthMetricType.HEART_RATE);

        assertThat(result).isPresent();
        assertThat(result.get().getId()).isEqualTo(older.getId());
    }

    // -----------------------------------------------------------------------
    // BigDecimal precision preserved on save/reload
    // -----------------------------------------------------------------------

    @Test
    void bigDecimalValue_precisionPreservedOnSaveAndReload() {
        User elderly = createElderlyUser("0903000007");

        BigDecimal precise = new BigDecimal("98.60");
        HealthMetric saved = healthMetricRepository.save(HealthMetric.builder()
                .elderly(elderly)
                .type(HealthMetricType.TEMPERATURE)
                .value(precise)
                .unit("°C")
                .recordedAt(OffsetDateTime.now())
                .build());

        healthMetricRepository.flush();

        HealthMetric reloaded = healthMetricRepository.findById(saved.getId()).orElseThrow();

        // compareTo ignores scale differences (98.60 == 98.6), but we want to confirm
        // the stored value rounds to the same 2-decimal-place value
        assertThat(reloaded.getValue().compareTo(precise)).isEqualTo(0);
    }
}
