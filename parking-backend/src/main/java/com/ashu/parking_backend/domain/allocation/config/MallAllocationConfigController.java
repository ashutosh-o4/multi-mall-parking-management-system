package com.ashu.parking_backend.domain.allocation.config;

import com.ashu.parking_backend.common.response.ApiResponse;
import com.ashu.parking_backend.domain.allocation.config.dto.AllocationConfigResponse;
import com.ashu.parking_backend.domain.allocation.config.dto.CreateAllocationConfigRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/allocation-config")
@RequiredArgsConstructor
public class MallAllocationConfigController {

    private final MallAllocationConfigService configService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<AllocationConfigResponse>> createConfig(
            @Valid @RequestBody CreateAllocationConfigRequest request) {

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        configService.createConfig(request),
                        "Allocation config created successfully"
                ));
    }

    @GetMapping("/mall/{mallId}/active")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<AllocationConfigResponse>> getActiveConfig(
            @PathVariable Long mallId) {

        return ResponseEntity.ok(
                ApiResponse.success(configService.getActiveConfig(mallId))
        );
    }
}
