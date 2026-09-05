package com.carenest.backend.dto.feed;

import lombok.Builder;
import lombok.Getter;

/** Result of toggling a "thả tim" reaction. */
@Getter
@Builder
public class FeedReactionResponse {

    private boolean reacted;
    private int reactionCount;
    private boolean handled;
}
