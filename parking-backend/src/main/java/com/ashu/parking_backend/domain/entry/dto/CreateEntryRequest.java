package com.ashu.parking_backend.domain.entry.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateEntryRequest {

    @NotBlank(message = "Vehicle number is  required")
    @Size(max=20, message = "Vehicle number is must not  exceed 20 characters")
    @Pattern(regexp = "^[A-Z0-9 ]+$",
            message = "Vehicle number must contain only uppercase letters, numbers, and spaces")
    private String vehicleNumber;

    @NotNull(message = "Mall Id is required")
    private Long mallId;
}
