package com.carenest.backend.service;

import com.carenest.backend.dto.notification.NotificationResponse;
import com.carenest.backend.entity.Notification;
import com.carenest.backend.exception.NotFoundException;
import com.carenest.backend.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

    private final NotificationRepository notificationRepository;

    @Transactional(readOnly = true)
    public List<NotificationResponse> getByUserId(Long userId, int page, int size) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(page, size))
            .stream()
            .map(this::toResponse)
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadAtIsNull(userId);
    }

    public NotificationResponse markAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Notification không tồn tại: " + id));
        if (notification.getReadAt() == null) {
            notification.setReadAt(OffsetDateTime.now());
            notificationRepository.save(notification);
        }
        return toResponse(notification);
    }

    public void markAllAsRead(Long userId) {
        var page = notificationRepository.findByUserIdOrderByCreatedAtDesc(
            userId, PageRequest.of(0, 500));
        page.forEach(notification -> {
            if (notification.getReadAt() == null) {
                notification.setReadAt(OffsetDateTime.now());
                notificationRepository.save(notification);
            }
        });
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
            .id(n.getId())
            .userId(n.getUser().getId())
            .type(n.getType())
            .title(n.getTitle())
            .body(n.getBody())
            .data(n.getData())
            .readAt(n.getReadAt())
            .createdAt(n.getCreatedAt())
            .build();
    }
}
