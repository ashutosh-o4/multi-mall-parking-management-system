package com.ashu.parking_backend.domain.allocation.config.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateAllocationConfigRequest {

    @NotNull(message = "Mall id is required")
    private Long mallId;

    @NotNull(message = "Exit weight is required")
    @DecimalMin(value = "0.0", message = "Weight must be positive")
    private Double weightExit;

    @NotNull(message = "Elevator weight is required")
    @DecimalMin(value = "0.0", message = "Weight must be positive")
    private Double weightElevator;

    @NotNull(message = "VIP Bonus is required")
    @DecimalMin(value = "0.0", message = "VIP Bonus must be positive")
    private Double vipBonus;

    @NotNull(message = "Effective from date is required")
    @Future(message = "Effective from must be a future date")
    private LocalDateTime effectiveFrom;
}
