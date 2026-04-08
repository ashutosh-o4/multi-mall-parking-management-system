package com.ashu.parking_backend.domain.floor;

import com.ashu.parking_backend.common.response.ApiResponse;
import com.ashu.parking_backend.domain.floor.dto.CreateFloorRequest;
import com.ashu.parking_backend.domain.floor.dto.FloorResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/floors")
@RequiredArgsConstructor
public class FloorController {

    private final FloorService floorService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<FloorResponse>> createFloor(
            @Valid @RequestBody CreateFloorRequest request){

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(floorService.createFloor(request),"Floor created successfully"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<FloorResponse>> getFloor(
            @PathVariable long id){

        return ResponseEntity.ok(
                ApiResponse.success(floorService.getFloorById(id))
        );
    }

    @GetMapping("/mall/{mallId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<FloorResponse>>> getFloorsByMall(
            @PathVariable Long mallId) {

        return ResponseEntity.ok(
                ApiResponse.success(floorService.getFloorsByMallId(mallId))
        );
    }
}
