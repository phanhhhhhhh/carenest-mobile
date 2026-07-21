package com.carenest.backend.repository;

import com.carenest.backend.entity.Notification;
import com.carenest.backend.entity.NotificationType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    Page<Notification> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);
    long countByUserIdAndReadAtIsNull(Long userId);
    Page<Notification> findByUserIdAndTypeOrderByCreatedAtDesc(Long userId, NotificationType type, Pageable pageable);

    @Query("SELECT n.user.id AS userId, COUNT(n) AS cnt FROM Notification n WHERE n.user.id IN :userIds AND n.readAt IS NULL GROUP BY n.user.id")
    List<Object[]> countUnreadByUserIds(@Param("userIds") List<Long> userIds);

    @Query(value = "SELECT DISTINCT ON (user_id) * FROM notifications WHERE user_id IN :userIds ORDER BY user_id, created_at DESC", nativeQuery = true)
    List<Notification> findLatestPerUser(@Param("userIds") List<Long> userIds);
}