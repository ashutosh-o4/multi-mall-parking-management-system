package com.ashu.parking_backend.domain.slot.dto;


import com.ashu.parking_backend.common.enums.SlotStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSlotStatusRequest {

    @NotNull(message = "Status is required")
    private SlotStatus status;
}
