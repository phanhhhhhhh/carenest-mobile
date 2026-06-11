package com.carenest.backend.repository;

import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByPhoneAndDeletedAtIsNull(String phone);
    boolean existsByPhoneAndDeletedAtIsNull(String phone);
    List<User> findAllByRoleAndDeletedAtIsNull(UserRole role);
}
