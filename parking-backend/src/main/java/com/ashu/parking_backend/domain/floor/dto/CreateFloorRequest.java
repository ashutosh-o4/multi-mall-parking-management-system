package com.ashu.parking_backend.domain.floor.dto;

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
public class CreateFloorRequest {

    @NotBlank(message = "Floor name is required")
    @Size(max=50, message = "Floor name must not exceed 50 characters")
    private String name;

    @NotNull(message = "Mall Id is required")
    private Long mallId;
}
