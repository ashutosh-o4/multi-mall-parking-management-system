package com.ashu.parking_backend.domain.allocation.config;

import com.ashu.parking_backend.domain.allocation.config.dto.AllocationConfigResponse;
import com.ashu.parking_backend.domain.allocation.config.dto.CreateAllocationConfigRequest;

public interface MallAllocationConfigService {
    AllocationConfigResponse createConfig(CreateAllocationConfigRequest request);
    AllocationConfigResponse getActiveConfig(Long mallId);
}
