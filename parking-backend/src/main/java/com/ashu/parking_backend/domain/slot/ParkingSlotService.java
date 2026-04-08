package com.ashu.parking_backend.domain.slot;

import com.ashu.parking_backend.domain.slot.dto.CreatesSlotRequest;
import com.ashu.parking_backend.domain.slot.dto.SlotResponse;
import com.ashu.parking_backend.domain.slot.dto.UpdateSlotStatusRequest;

import java.util.List;

public interface ParkingSlotService {
    SlotResponse createSlot(CreatesSlotRequest request);
    List<SlotResponse> getSlotsByFloor(Long floorId);
    List<SlotResponse> getSlotsByMall(Long mallId);
    SlotResponse updateSlotStatus(Long id, UpdateSlotStatusRequest request);
}
