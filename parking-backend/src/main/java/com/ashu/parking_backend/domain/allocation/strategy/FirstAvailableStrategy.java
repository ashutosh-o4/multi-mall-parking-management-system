package com.ashu.parking_backend.domain.allocation.strategy;

import com.ashu.parking_backend.domain.allocation.config.MallAllocationConfig;
import com.ashu.parking_backend.domain.slot.ParkingSlot;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Component("firstAvailableStrategy")
@Slf4j
public class FirstAvailableStrategy implements SlotAllocationStrategy {

    @Override
    public ParkingSlot selectParkingSlot(List<ParkingSlot> availableParkingSlots, MallAllocationConfig config) {

        log.debug("First Available Strategy: selecting slot {}", availableParkingSlots.getFirst().getSlotNumber());
        return availableParkingSlots.getFirst();
    }
}
