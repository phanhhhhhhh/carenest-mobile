package com.carenest.backend.dto.feed;

import com.carenest.backend.entity.FeedItemType;
import lombok.Builder;
import lombok.Getter;

import java.time.OffsetDateTime;

/** One row in the Family Care Feed (UC A2). */
@Getter
@Builder
public class FeedItemResponse {

    /** Composite id, e.g. "CHECK_IN:42" — stable per source row. */
    private String id;
    private FeedItemType type;
    private Long itemRef;
    private Long elderlyId;
    private String elderlyName;
    private OffsetDateTime occurredAt;
    private String title;
    private String subtitle;

    /**
     * Generic "someone has dealt with this" flag. The feed only ever shows this
     * overall state, never who acted (spec 4.2).
     */
    private boolean handled;

    private int reactionCount;
    private boolean reactedByMe;
}
