package com.ashu.parking_backend.domain.allocation.config.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class AllocationConfigResponse {
    private Long id;
    private Long mallId;
    private Double weightExit;
    private Double weightElevator;
    private Double vipBonus;
    private LocalDateTime effectiveFrom;
    private LocalDateTime createdAt;
}
