package com.ashu.parking_backend.domain.slot.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreatesSlotRequest {

    @NotBlank(message = "Slot number is required")
    @Size(max=20, message = "lot number must not exceed 20 characters")
    private String slotNumber;

    @NotNull(message = "Floor Id is required")
    private Long floorId;

    @NotNull(message = "Distance to exit is required")
    @Min(value = 0, message = "Distance must be a positive number")
    private Integer distanceToExit;

    @NotNull(message = "Distance to elevator is required")
    @Min(value = 0, message = "Distance must be a positive number")
    private Integer distanceToElevator;

    private boolean vipReserved= false;
}
