package com.ashu.parking_backend.domain.mall.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class MallResponse {
    private Long id;
    private String name;
    private String address;
    private String status;
    private LocalDateTime createdAt;
}
