package com.carenest.backend.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
public class VisitReminderPushListener {

    private final FcmService fcmService;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void sendAfterCommit(VisitReminderPushEvent event) {
        if (!event.recipientIds().isEmpty()) {
            fcmService.sendToUsers(event.recipientIds(), event.title(), event.body(), event.data());
        }
    }
}
