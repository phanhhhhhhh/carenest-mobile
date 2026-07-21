package com.carenest.backend.dto.camera;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class CameraStatusResponse {
    private boolean hasCamera;
    private Integer cameraCount;
    private Boolean allOnline;
    private String indicatorColor;
    private String statusText;
    private String message;
}
