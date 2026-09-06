package com.carenest.backend.service;

import com.carenest.backend.dto.visit.ConfirmVisitRequest;
import com.carenest.backend.dto.visit.VisitStreakResponse;
import com.carenest.backend.entity.FamilyVisit;
import com.carenest.backend.entity.FamilyVisitSettings;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.entity.VisitCycleType;
import com.carenest.backend.repository.FamilyLinkRepository;
import com.carenest.backend.repository.FamilyVisitRepository;
import com.carenest.backend.repository.FamilyVisitSettingsRepository;
import com.carenest.backend.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VisitStreakServiceTest {

    @Mock private FamilyVisitRepository visitRepository;
    @Mock private FamilyVisitSettingsRepository settingsRepository;
    @Mock private FamilyLinkRepository familyLinkRepository;
    @Mock private UserRepository userRepository;
    @Mock private FcmService fcmService;
    @Mock private NotificationService notificationService;

    @InjectMocks private VisitStreakService service;

    private User elderly;
    private User member;
    private FamilyVisitSettings settings;

    @BeforeEach
    void setUp() {
        elderly = User.builder().id(1L).name("Bà Sáu").role(UserRole.ELDERLY).build();
        member = User.builder().id(2L).name("Anh Tư").role(UserRole.FAMILY).build();
        settings = FamilyVisitSettings.builder().elderly(elderly).cycleType(VisitCycleType.WEEKLY).build();

        lenient().when(userRepository.findById(1L)).thenReturn(Optional.of(elderly));
        lenient().when(userRepository.findById(2L)).thenReturn(Optional.of(member));
        lenient().when(settingsRepository.findByElderlyId(1L)).thenReturn(Optional.of(settings));
        lenient().when(settingsRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        lenient().when(visitRepository.save(any())).thenAnswer(i -> i.getArgument(0));
        lenient().when(visitRepository.findByElderlyIdOrderByVisitedAtDesc(1L)).thenReturn(List.of());
        lenient().when(familyLinkRepository.findAllFamilyByElderlyIdAndStatus(any(), any())).thenReturn(List.of());
    }

    private static OffsetDateTime ict(LocalDate d) {
        return d.atTime(10, 0).atOffset(ZoneOffset.ofHours(7));
    }

    @Test
    void firstVisitStartsStreakAtOne() {
        VisitStreakResponse r = service.confirmVisit(1L, 2L,
            ConfirmVisitRequest.builder().visitedAt(ict(LocalDate.of(2026, 9, 2))).build());
        assertEquals(1, r.getCurrentStreak());
    }

    @Test
    void visitInConsecutiveWeekIncrementsStreak() {
        settings.setCurrentStreak(3);
        settings.setLastVisitAt(ict(LocalDate.of(2026, 9, 1)));  // Tue of ISO week 36
        service.confirmVisit(1L, 2L,
            ConfirmVisitRequest.builder().visitedAt(ict(LocalDate.of(2026, 9, 8))).build()); // week 37
        assertEquals(4, settings.getCurrentStreak());
    }

    @Test
    void secondVisitSameWeekDoesNotDoubleCount() {
        settings.setCurrentStreak(2);
        settings.setLastVisitAt(ict(LocalDate.of(2026, 9, 8)));   // Mon week 37
        service.confirmVisit(1L, 2L,
            ConfirmVisitRequest.builder().visitedAt(ict(LocalDate.of(2026, 9, 10))).build()); // Wed week 37
        assertEquals(2, settings.getCurrentStreak());
    }

    @Test
    void visitAfterAGapResetsStreakToOne() {
        settings.setCurrentStreak(5);
        settings.setLastVisitAt(ict(LocalDate.of(2026, 8, 10))); // ~4 weeks earlier
        service.confirmVisit(1L, 2L,
            ConfirmVisitRequest.builder().visitedAt(ict(LocalDate.of(2026, 9, 8))).build());
        assertEquals(1, settings.getCurrentStreak());
    }

    @Test
    void longestStreakIsRemembered() {
        settings.setCurrentStreak(3);
        settings.setLongestStreak(3);
        settings.setLastVisitAt(ict(LocalDate.of(2026, 9, 1)));
        service.confirmVisit(1L, 2L,
            ConfirmVisitRequest.builder().visitedAt(ict(LocalDate.of(2026, 9, 8))).build());
        assertEquals(4, settings.getLongestStreak());
    }
}
