package com.ashu.parking_backend.domain.staff.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class StaffResponse {
    private Long id;
    private String username;
    private String role;
    private String status;
    private Long mallId;
    private String mallName;
    private LocalDateTime createdAt;
}
