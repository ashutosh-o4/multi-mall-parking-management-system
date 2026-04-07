package com.ashu.parking_backend.domain.auth.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class LoginResponse {
    private String token;
    private String username;
    private String role;
    private Long mallId; //null for SUPER-ADMIN -frontend needs this to scope requests
}
