package com.carenest.backend.repository;

import com.carenest.backend.entity.FeedItemType;
import com.carenest.backend.entity.FeedReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface FeedReactionRepository extends JpaRepository<FeedReaction, Long> {

    List<FeedReaction> findByElderlyIdAndItemTypeAndItemRefIn(
        Long elderlyId, FeedItemType itemType, Collection<Long> itemRefs);

    Optional<FeedReaction> findByItemTypeAndItemRefAndFamilyUserId(
        FeedItemType itemType, Long itemRef, Long familyUserId);
}
