package com.ashu.parking_backend.domain.slot;

import com.ashu.parking_backend.common.response.ApiResponse;
import com.ashu.parking_backend.domain.slot.dto.CreatesSlotRequest;
import com.ashu.parking_backend.domain.slot.dto.SlotResponse;
import com.ashu.parking_backend.domain.slot.dto.UpdateSlotStatusRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/slots")
@RequiredArgsConstructor
public class ParkingSlotController {


    private  final ParkingSlotService parkingSlotService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<SlotResponse>> createSlot(
            @Valid @RequestBody CreatesSlotRequest  request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        parkingSlotService.createSlot(request), "Slot created successfully"
                ));
    }

    @GetMapping("/floor/{floorId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<SlotResponse>>> getSlotsByFloor(
            @PathVariable Long floorId) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        parkingSlotService.getSlotsByFloor(floorId)
                )
        );
    }

    @GetMapping("/mall/{mallId}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<List<SlotResponse>>> getSlotsByMall(
            @PathVariable Long mallId) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        parkingSlotService.getSlotsByMall(mallId)
                )
        );
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<SlotResponse>> updateSlotStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateSlotStatusRequest request) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        parkingSlotService.updateSlotStatus(id, request),
                        "Slot status updated"
                )
        );
    }
}
