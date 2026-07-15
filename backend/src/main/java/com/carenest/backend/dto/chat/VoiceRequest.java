package com.carenest.backend.dto.chat;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.web.multipart.MultipartFile;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class VoiceRequest {

    
    private MultipartFile audio;

    
    private String sessionId;

    
    private String language;
}
