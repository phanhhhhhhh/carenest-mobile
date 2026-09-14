package com.carenest.backend.repository;

import jakarta.persistence.LockModeType;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Lock;

import static org.assertj.core.api.Assertions.assertThat;

class UserRepositoryVisitLockTest {

    @Test
    void visitMutationLookupUsesPessimisticWriteLock() throws NoSuchMethodException {
        Lock lock = UserRepository.class
            .getMethod("findByIdForVisitUpdate", Long.class)
            .getAnnotation(Lock.class);

        assertThat(lock).isNotNull();
        assertThat(lock.value()).isEqualTo(LockModeType.PESSIMISTIC_WRITE);
    }
}
