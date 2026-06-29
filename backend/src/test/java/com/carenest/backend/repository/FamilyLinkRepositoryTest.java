package com.carenest.backend.repository;

import com.carenest.backend.entity.FamilyLink;
import com.carenest.backend.entity.FamilyLinkStatus;
import com.carenest.backend.entity.User;
import com.carenest.backend.entity.UserRole;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@Transactional
class FamilyLinkRepositoryTest extends BaseRepositoryTest {

    @Autowired
    private FamilyLinkRepository familyLinkRepository;

    @Autowired
    private UserRepository userRepository;

    private User createElderlyUser(String phone) {
        return userRepository.save(User.builder()
                .role(UserRole.ELDERLY)
                .phone(phone)
                .name("Test Elderly")
                .build());
    }

    private User createFamilyUser(String phone) {
        return userRepository.save(User.builder()
                .role(UserRole.FAMILY)
                .phone(phone)
                .name("Test Family")
                .build());
    }

    private FamilyLink createLink(User elderly, User family, FamilyLinkStatus status) {
        return familyLinkRepository.save(FamilyLink.builder()
                .elderly(elderly)
                .family(family)
                .relationship("Son")
                .status(status)
                .build());
    }

    @Test
    void findAllFamilyByElderlyIdAndStatus_returnsActiveFamilyMembers() {
        User elderly = createElderlyUser("0904000001");
        User family1 = createFamilyUser("0904000002");
        User family2 = createFamilyUser("0904000003");
        User pendingFamily = createFamilyUser("0904000004");

        createLink(elderly, family1, FamilyLinkStatus.ACTIVE);
        createLink(elderly, family2, FamilyLinkStatus.ACTIVE);
        createLink(elderly, pendingFamily, FamilyLinkStatus.PENDING);

        List<FamilyLink> results = familyLinkRepository
                .findAllFamilyByElderlyIdAndStatus(elderly.getId(), FamilyLinkStatus.ACTIVE);

        assertThat(results).hasSize(2);
        assertThat(results).extracting(fl -> fl.getFamily().getId())
                .containsExactlyInAnyOrder(family1.getId(), family2.getId());
    }

    @Test
    void findAllFamilyByElderlyIdAndStatus_excludesSoftDeleted() {
        User elderly = createElderlyUser("0904000005");
        User family = createFamilyUser("0904000006");

        FamilyLink link = createLink(elderly, family, FamilyLinkStatus.ACTIVE);
        link.setDeletedAt(java.time.OffsetDateTime.now());
        familyLinkRepository.save(link);
        familyLinkRepository.flush();

        List<FamilyLink> results = familyLinkRepository
                .findAllFamilyByElderlyIdAndStatus(elderly.getId(), FamilyLinkStatus.ACTIVE);

        assertThat(results).isEmpty();
    }

    @Test
    void findAllFamilyByElderlyIdAndStatus_returnsEmptyWhenNoActiveLinks() {
        User elderly = createElderlyUser("0904000007");

        List<FamilyLink> results = familyLinkRepository
                .findAllFamilyByElderlyIdAndStatus(elderly.getId(), FamilyLinkStatus.ACTIVE);

        assertThat(results).isEmpty();
    }

    @Test
    void findAllElderlyByFamilyIdAndStatus_returnsLinkedElderly() {
        User elderly1 = createElderlyUser("0904000008");
        User elderly2 = createElderlyUser("0904000009");
        User family = createFamilyUser("0904000010");

        createLink(elderly1, family, FamilyLinkStatus.ACTIVE);
        createLink(elderly2, family, FamilyLinkStatus.ACTIVE);

        List<FamilyLink> results = familyLinkRepository
                .findAllElderlyByFamilyIdAndStatus(family.getId(), FamilyLinkStatus.ACTIVE);

        assertThat(results).hasSize(2);
        assertThat(results).extracting(fl -> fl.getElderly().getId())
                .containsExactlyInAnyOrder(elderly1.getId(), elderly2.getId());
    }

    @Test
    void findAllElderlyByFamilyIdAndStatus_excludesRevokedLinks() {
        User elderly = createElderlyUser("0904000011");
        User family = createFamilyUser("0904000012");

        createLink(elderly, family, FamilyLinkStatus.REVOKED);

        List<FamilyLink> results = familyLinkRepository
                .findAllElderlyByFamilyIdAndStatus(family.getId(), FamilyLinkStatus.ACTIVE);

        assertThat(results).isEmpty();
    }

    @Test
    void saveFamilyLink_throwsOnDuplicateElderlyFamilyPair() {
        User elderly = createElderlyUser("0904000013");
        User family = createFamilyUser("0904000014");

        createLink(elderly, family, FamilyLinkStatus.ACTIVE);
        familyLinkRepository.flush();

        FamilyLink duplicate = FamilyLink.builder()
                .elderly(elderly)
                .family(family)
                .relationship("Daughter")
                .status(FamilyLinkStatus.PENDING)
                .build();

        assertThatThrownBy(() -> {
            familyLinkRepository.save(duplicate);
            familyLinkRepository.flush();
        }).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void deleteElderlyUser_cascadeDeletesFamilyLinks() {
        User elderly = createElderlyUser("0904000015");
        User family = createFamilyUser("0904000016");

        FamilyLink link = createLink(elderly, family, FamilyLinkStatus.ACTIVE);
        Long linkId = link.getId();
        familyLinkRepository.flush();

        userRepository.delete(elderly);
        userRepository.flush();

        assertThat(familyLinkRepository.findById(linkId)).isEmpty();
    }
}