package com.carenest.backend.dto.feed;

import com.carenest.backend.entity.FeedItemType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeedReactionRequest {

    @NotNull(message = "itemType is required")
    private FeedItemType itemType;

    @NotNull(message = "itemRef is required")
    private Long itemRef;
}
