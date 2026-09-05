package com.carenest.backend.controller;

import com.carenest.backend.dto.feed.FeedItemResponse;
import com.carenest.backend.dto.feed.FeedReactionRequest;
import com.carenest.backend.dto.feed.FeedReactionResponse;
import com.carenest.backend.service.FamilyFeedService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FamilyFeedController {

    private final FamilyFeedService familyFeedService;

    @GetMapping("/elderly/{elderlyId}/feed")
    @PreAuthorize("@authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<List<FeedItemResponse>> getFeed(
        @PathVariable Long elderlyId,
        @RequestParam(required = false) Integer limit,
        @AuthenticationPrincipal Long viewerId
    ) {
        return ResponseEntity.ok(familyFeedService.getFeed(elderlyId, viewerId, limit));
    }

    @PostMapping("/elderly/{elderlyId}/feed/react")
    @PreAuthorize("hasRole('FAMILY') and @authz.isOwnerOrLinkedFamily(authentication.principal, #elderlyId)")
    public ResponseEntity<FeedReactionResponse> react(
        @PathVariable Long elderlyId,
        @Valid @RequestBody FeedReactionRequest request,
        @AuthenticationPrincipal Long familyUserId
    ) {
        return ResponseEntity.ok(familyFeedService.toggleReaction(
            elderlyId, familyUserId, request.getItemType(), request.getItemRef()));
    }
}
