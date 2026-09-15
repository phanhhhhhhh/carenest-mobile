package com.carenest.backend.scheduler;

import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import com.carenest.backend.repository.CheckInRepository;
import com.carenest.backend.repository.UserRepository;
import com.carenest.backend.service.FcmService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;
import java.util.Set;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.verifyNoMoreInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MissedCheckInReminderSchedulerTest {

    @Mock private UserRepository userRepository;
    @Mock private CheckInRepository checkInRepository;
    @Mock private FcmService fcmService;

    private MissedCheckInReminderScheduler scheduler;

    @BeforeEach
    void setUp() {
        scheduler = new MissedCheckInReminderScheduler(userRepository, checkInRepository, fcmService);
    }

    @Test
    void sendsReminderOnlyToElderlyWhoHaveNotCheckedInToday() {
        User elderly1 = User.builder().id(10L).name("Cụ An").role(UserRole.ELDERLY).build();
        User elderly2 = User.builder().id(20L).name("Cụ Bình").role(UserRole.ELDERLY).build();

        when(userRepository.findByRoleAndDeletedAtIsNull(UserRole.ELDERLY)).thenReturn(List.of(elderly1, elderly2));
        // elderly1 already checked in today (id 10L is in checkedInElderlyIds)
        when(checkInRepository.findElderlyIdsWithCheckInBetween(any(), any())).thenReturn(Set.of(10L));

        scheduler.sendMorningCheckInReminders();

        // elderly2 (id 20L) should receive notification
        verify(fcmService).sendToUser(
            eq(20L),
            eq("Chào buổi sáng ông/bà ☀️"),
            eq("Hôm nay ông/bà cảm thấy thế nào? Hãy chạm vào đây để báo tin cho con cháu nhé."),
            eq(Map.of("type", "CHECK_IN_REMINDER", "elderlyId", "20"))
        );
        verifyNoMoreInteractions(fcmService);
    }

    @Test
    void doesNothingWhenAllElderlyHaveCheckedIn() {
        User elderly1 = User.builder().id(10L).name("Cụ An").role(UserRole.ELDERLY).build();
        when(userRepository.findByRoleAndDeletedAtIsNull(UserRole.ELDERLY)).thenReturn(List.of(elderly1));
        when(checkInRepository.findElderlyIdsWithCheckInBetween(any(), any())).thenReturn(Set.of(10L));

        scheduler.sendMorningCheckInReminders();

        verifyNoInteractions(fcmService);
    }
}
