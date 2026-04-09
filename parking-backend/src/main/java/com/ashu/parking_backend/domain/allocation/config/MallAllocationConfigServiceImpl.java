package com.ashu.parking_backend.domain.allocation.config;

import com.ashu.parking_backend.common.exception.ResourceNotFoundException;
import com.ashu.parking_backend.domain.allocation.config.dto.AllocationConfigResponse;
import com.ashu.parking_backend.domain.allocation.config.dto.CreateAllocationConfigRequest;
import com.ashu.parking_backend.domain.mall.Mall;
import com.ashu.parking_backend.domain.mall.MallRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class MallAllocationConfigServiceImpl implements MallAllocationConfigService {

    private final MallAllocationConfigRepository configRepository;
    private final MallRepository mallRepository;


    @Override
    public AllocationConfigResponse createConfig(CreateAllocationConfigRequest request) {

        Mall mall= mallRepository.findById(request.getMallId())
                .orElseThrow(()-> new ResourceNotFoundException("Mall not found with id: " + request.getMallId()));

        MallAllocationConfig config=MallAllocationConfig.builder()
                .mall(mall)
                .weightExit(request.getWeightExit())
                .weightElevator(request.getWeightElevator())
                .vipBonus(request.getVipBonus())
                .effectiveFrom(request.getEffectiveFrom())
                .build();

        MallAllocationConfig saved=configRepository.save(config);
        log.info("Allocation config created for mall {} effective from {}",
                mall.getName(), request.getEffectiveFrom());

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public AllocationConfigResponse getActiveConfig(Long mallId) {
        return configRepository
                .findLatestActiveConfig(mallId, LocalDateTime.now())
                .map(this::toResponse)
                .orElseThrow(()->
                        new ResourceNotFoundException(
                                "No active config found for mallId: " + mallId
                        ));
    }

    private AllocationConfigResponse toResponse(MallAllocationConfig config) {
        return AllocationConfigResponse.builder()
                .id(config.getId())
                .mallId(config.getMall().getId())
                .weightExit(config.getWeightExit())
                .weightElevator(config.getWeightElevator())
                .vipBonus(config.getVipBonus())
                .effectiveFrom(config.getEffectiveFrom())
                .createdAt(config.getCreatedAt())
                .build();
    }
}
