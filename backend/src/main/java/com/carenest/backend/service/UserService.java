package com.carenest.backend.service;

import com.carenest.backend.dto.user.NotificationPreferencesRequest;
import com.carenest.backend.entity.NotificationPreferences;
import com.carenest.backend.entity.User;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserService {

    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public NotificationPreferences getNotificationPreferences(Long userId) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User không tồn tại: " + userId));
        return user.getNotificationPreferences();
    }

    public NotificationPreferences updateNotificationPreferences(
            Long userId, NotificationPreferencesRequest request) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User không tồn tại: " + userId));

        NotificationPreferences current = user.getNotificationPreferences();
        if (current == null) {
            current = new NotificationPreferences();
        }

        // Only update non-null fields (partial update using wrapper types from request)
        if (request.getMedicationReminder() != null) {
            current.setMedicationReminder(request.getMedicationReminder());
        }
        if (request.getReminderMinutesBefore() != null) {
            current.setReminderMinutesBefore(request.getReminderMinutesBefore());
        }
        if (request.getHealthAlert() != null) {
            current.setHealthAlert(request.getHealthAlert());
        }
        if (request.getFamilyUpdate() != null) {
            current.setFamilyUpdate(request.getFamilyUpdate());
        }
        if (request.getQuietHoursStart() != null) {
            current.setQuietHoursStart(request.getQuietHoursStart());
        }
        if (request.getQuietHoursEnd() != null) {
            current.setQuietHoursEnd(request.getQuietHoursEnd());
        }

        user.setNotificationPreferences(current);
        userRepository.save(user);
        return current;
    }

    public void updateFcmToken(Long userId, String fcmToken) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new NotFoundException("User không tồn tại: " + userId));
        user.setFcmToken(fcmToken);
        userRepository.save(user);
    }
}
