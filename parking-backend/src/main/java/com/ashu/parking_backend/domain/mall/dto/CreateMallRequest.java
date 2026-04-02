package com.ashu.parking_backend.domain.mall.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateMallRequest {
    @NotBlank(message = "Mall name is required")
    @Size(max=150, message = "Mall name must not exceed 150 characters")
    private String name;

    @NotBlank(message = "Address is required")
    @Size(max=300 , message = "Address must not exceed 300 characters")
    private String address;
}
