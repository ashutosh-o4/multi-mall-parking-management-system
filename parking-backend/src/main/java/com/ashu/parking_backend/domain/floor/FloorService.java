package com.ashu.parking_backend.domain.floor;

import com.ashu.parking_backend.domain.floor.dto.CreateFloorRequest;
import com.ashu.parking_backend.domain.floor.dto.FloorResponse;

import java.util.List;

public interface FloorService {
    FloorResponse createFloor(CreateFloorRequest request);
    FloorResponse getFloorById(Long id);
    List<FloorResponse> getFloorsByMallId(Long mallId);
}
