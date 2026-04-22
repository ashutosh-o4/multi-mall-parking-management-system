package com.ashu.parking_backend.domain.staff.dto;

import com.ashu.parking_backend.common.enums.StaffStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateStaffStatusRequest {

    @NotNull(message = "Status is required")
    private StaffStatus status;
}
