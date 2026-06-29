package com.carenest.backend.repository;

import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Transactional
class UserRepositoryTest extends BaseRepositoryTest {

    @Autowired
    private UserRepository userRepository;

    private User createUser(String phone, UserRole role) {
        return userRepository.save(User.builder()
                .role(role)
                .phone(phone)
                .name("Test User")
                .build());
    }

    private User createElderlyUser(String phone) {
        return createUser(phone, UserRole.ELDERLY);
    }

    @Test
    void findByPhoneAndDeletedAtIsNull_foundWhenNotDeleted() {
        createElderlyUser("0901000001");

        Optional<User> result = userRepository.findByPhoneAndDeletedAtIsNull("0901000001");

        assertThat(result).isPresent();
        assertThat(result.get().getPhone()).isEqualTo("0901000001");
    }

    @Test
    void findByPhoneAndDeletedAtIsNull_notFoundAfterSoftDelete() {
        User user = createElderlyUser("0901000002");
        user.setDeletedAt(OffsetDateTime.now());
        userRepository.save(user);
        userRepository.flush();

        Optional<User> result = userRepository.findByPhoneAndDeletedAtIsNull("0901000002");

        assertThat(result).isEmpty();
    }

    @Test
    void findByPhoneAndDeletedAtIsNull_notFoundForNonExistentPhone() {
        Optional<User> result = userRepository.findByPhoneAndDeletedAtIsNull("0999999999");

        assertThat(result).isEmpty();
    }

    @Test
    void existsByPhoneAndDeletedAtIsNull_returnsTrueWhenActive() {
        createElderlyUser("0901000003");

        boolean exists = userRepository.existsByPhoneAndDeletedAtIsNull("0901000003");

        assertThat(exists).isTrue();
    }

    @Test
    void existsByPhoneAndDeletedAtIsNull_returnsFalseAfterSoftDelete() {
        User user = createElderlyUser("0901000004");
        user.setDeletedAt(OffsetDateTime.now());
        userRepository.save(user);
        userRepository.flush();

        boolean exists = userRepository.existsByPhoneAndDeletedAtIsNull("0901000004");

        assertThat(exists).isFalse();
    }

    @Test
    void existsByPhoneAndDeletedAtIsNull_returnsFalseForUnknownPhone() {
        boolean exists = userRepository.existsByPhoneAndDeletedAtIsNull("0888000000");

        assertThat(exists).isFalse();
    }

    @Test
    void saveUser_throwsOnDuplicatePhone() {
        createElderlyUser("0901000005");
        userRepository.flush();

        User duplicate = User.builder()
                .role(UserRole.FAMILY)
                .phone("0901000005")
                .name("Duplicate User")
                .build();

        assertThatThrownBy(() -> {
            userRepository.save(duplicate);
            userRepository.flush();
        }).isInstanceOf(DataIntegrityViolationException.class);
    }
}