package com.ashu.parking_backend.domain.mall.dto;

import com.ashu.parking_backend.common.enums.MallStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class UpdateMallStatusRequest {

    @NotNull(message = "Status is required")
    private MallStatus status;
}
