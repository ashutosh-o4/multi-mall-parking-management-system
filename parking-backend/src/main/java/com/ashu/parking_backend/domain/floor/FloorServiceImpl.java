package com.ashu.parking_backend.domain.floor;

import com.ashu.parking_backend.common.exception.BusinessException;
import com.ashu.parking_backend.domain.floor.dto.CreateFloorRequest;
import com.ashu.parking_backend.domain.floor.dto.FloorResponse;
import com.ashu.parking_backend.domain.mall.Mall;
import com.ashu.parking_backend.domain.mall.MallRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.ResourceAccessException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class FloorServiceImpl implements FloorService {

    private final FloorRepository floorRepository;
    private final MallRepository mallRepository;

    @Override
    public FloorResponse createFloor(CreateFloorRequest request) {
        Mall mall=mallRepository.findById(request.getMallId())
                .orElseThrow(()->
                        new ResourceAccessException("Mall not found with id: "+ request.getMallId()));

        if(floorRepository.existsByNameAndMall_Id(
                request.getName().trim(),request.getMallId())){
            throw new BusinessException("Floor '"+request.getName() +"' already exists in this mall");
        }

        Floor floor= Floor.builder()
                .name(request.getName().trim())
                .mall(mall)
                .build();

        Floor savedFloor=floorRepository.save(floor);
        log.info("Floor created with id: {} in mall: {}", savedFloor.getId(),savedFloor.getName());
        return toResponse(savedFloor);
    }

    @Override
    @Transactional(readOnly = true)
    public FloorResponse getFloorById(Long id) {
        Floor floor=floorRepository.findById(id).orElseThrow(()-> new ResourceAccessException("Floor not found with id: "+ id));

        return toResponse(floor);
    }

    @Override
    @Transactional(readOnly = true)
    public List<FloorResponse> getFloorsByMallId(Long mallId) {
        return floorRepository.findAllByMall_Id(mallId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    private FloorResponse toResponse(Floor floor){
        return FloorResponse.builder()
                .id(floor.getId())
                .name(floor.getName())
                .mallId(floor.getMall().getId())
                .mallName(floor.getMall().getName())
                .createdAt(floor.getCreatedAt())
                .build();
    }
}
