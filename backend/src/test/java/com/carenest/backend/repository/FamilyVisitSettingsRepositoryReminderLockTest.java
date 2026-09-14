package com.carenest.backend.repository;

import jakarta.persistence.LockModeType;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.lang.reflect.Method;

import static org.junit.jupiter.api.Assertions.assertEquals;

class FamilyVisitSettingsRepositoryReminderLockTest {

    @Test
    void reminderLookupUsesDatabaseWriteLock() throws Exception {
        Method method = FamilyVisitSettingsRepository.class
            .getMethod("findByIdForReminderUpdate", Long.class);
        assertEquals(LockModeType.PESSIMISTIC_WRITE, method.getAnnotation(Lock.class).value());
    }

    @Test
    void eachSettingUsesAnIndependentTransaction() throws Exception {
        Method method = com.carenest.backend.service.VisitReminderService.class
            .getMethod("processSetting", Long.class, java.time.LocalDate.class);
        assertEquals(Propagation.REQUIRES_NEW, method.getAnnotation(Transactional.class).propagation());
    }

    @Test
    void pushDispatchIsDeferredUntilCommit() throws Exception {
        Method method = com.carenest.backend.service.VisitReminderPushListener.class
            .getMethod("sendAfterCommit", com.carenest.backend.service.VisitReminderPushEvent.class);
        assertEquals(TransactionPhase.AFTER_COMMIT,
            method.getAnnotation(TransactionalEventListener.class).phase());
    }
}
