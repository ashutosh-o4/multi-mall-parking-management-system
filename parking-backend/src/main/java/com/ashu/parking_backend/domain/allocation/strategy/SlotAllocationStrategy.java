package com.ashu.parking_backend.domain.allocation.strategy;

import com.ashu.parking_backend.domain.allocation.config.MallAllocationConfig;
import com.ashu.parking_backend.domain.slot.ParkingSlot;

import java.util.List;

public interface SlotAllocationStrategy {
    ParkingSlot selectParkingSlot(List<ParkingSlot> availableParkingSlots, MallAllocationConfig config);
}
