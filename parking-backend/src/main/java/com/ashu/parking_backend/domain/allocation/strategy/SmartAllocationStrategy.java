package com.ashu.parking_backend.domain.allocation.strategy;

import com.ashu.parking_backend.common.exception.BusinessException;
import com.ashu.parking_backend.domain.allocation.config.MallAllocationConfig;
import com.ashu.parking_backend.domain.slot.ParkingSlot;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Comparator;
import java.util.List;

@Component("smartAllocationStrategy")
@Slf4j
public class SmartAllocationStrategy implements SlotAllocationStrategy {
    @Override
    public ParkingSlot selectParkingSlot(List<ParkingSlot> availableParkingSlots, MallAllocationConfig config) {

        return availableParkingSlots.stream()
                .min(Comparator.comparingDouble(slot -> calculateScore(slot, config)))
                .orElseThrow(() -> new BusinessException("No available parking slot found"));
    }

    private double calculateScore(ParkingSlot slot,MallAllocationConfig config) {
        double score = (config.getWeightExit()* slot.getDistanceToExit())
                +(config.getWeightElevator() * slot.getDistanceToElevator());

        if(slot.isVipReserved()){
            score -= config.getVipBonus();
        }
        return score;
    }
}
