package com.carenest.backend.repository;

import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByPhoneAndDeletedAtIsNull(String phone);

    boolean existsByPhoneAndDeletedAtIsNull(String phone);

    Optional<User> findByEmailAndDeletedAtIsNull(String email);

    boolean existsByEmailAndDeletedAtIsNull(String email);

    Optional<User> findByEmailVerificationToken(String token);

    Page<User> findByRoleAndDeletedAtIsNull(UserRole role, Pageable pageable);

    // --- Admin console ---

    long countByDeletedAtIsNull();

    long countByRoleAndDeletedAtIsNull(UserRole role);

    @Query("SELECT u FROM User u WHERE u.deletedAt IS NULL "
        + "AND (:role IS NULL OR u.role = :role) "
        + "AND (:q = '' "
        + "     OR LOWER(u.name) LIKE LOWER(CONCAT('%', :q, '%')) "
        + "     OR u.phone LIKE CONCAT('%', :q, '%') "
        + "     OR LOWER(u.email) LIKE LOWER(CONCAT('%', :q, '%')))")
    Page<User> searchForAdmin(@Param("role") UserRole role, @Param("q") String q, Pageable pageable);
}
