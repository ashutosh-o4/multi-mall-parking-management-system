package com.ashu.parking_backend.domain.floor.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class FloorResponse {
    private Long id;
    private String name;
    private Long mallId;
    private String mallName;
    private LocalDateTime createdAt;
}
