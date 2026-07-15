package com.carenest.backend.service;

import com.carenest.backend.entity.User;
import com.carenest.backend.repository.UserRepository;
import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.Notification;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class FcmService {

    private final UserRepository userRepository;

    
    public void sendToUser(Long userId, String title, String body, Map<String, String> data) {
        if (FirebaseApp.getApps().isEmpty()) {
            log.debug("Firebase not initialized — skipping push to userId={}", userId);
            return;
        }

        userRepository.findById(userId).ifPresent(user -> {
            sendToToken(user.getFcmToken(), title, body, data);
        });
    }

    
    public void sendToUsers(List<Long> userIds, String title, String body, Map<String, String> data) {
        if (FirebaseApp.getApps().isEmpty()) {
            log.debug("Firebase not initialized — skipping push to {} users", userIds.size());
            return;
        }

        List<User> users = userRepository.findAllById(userIds);
        for (User user : users) {
            sendToToken(user.getFcmToken(), title, body, data);
        }
    }

    private void sendToToken(String fcmToken, String title, String body, Map<String, String> data) {
        if (fcmToken == null || fcmToken.isBlank()) {
            log.debug("Skipping push — no FCM token for user");
            return;
        }

        try {
            Message.Builder builder = Message.builder()
                .setToken(fcmToken)
                .setNotification(Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build());

            if (data != null && !data.isEmpty()) {
                builder.putAllData(data);
            }

            String response = FirebaseMessaging.getInstance().send(builder.build());
            log.debug("FCM push sent: token={} response={}", fcmToken.substring(0, 10) + "...", response);
        } catch (FirebaseMessagingException e) {
            log.warn("Failed to send FCM push to token={}: {}",
                fcmToken.substring(0, Math.min(10, fcmToken.length())) + "...", e.getMessage());
        }
    }
}
