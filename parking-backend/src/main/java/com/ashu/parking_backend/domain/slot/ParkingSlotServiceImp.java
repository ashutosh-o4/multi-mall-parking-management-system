package com.ashu.parking_backend.domain.slot;

import com.ashu.parking_backend.common.enums.SlotStatus;
import com.ashu.parking_backend.common.exception.BusinessException;
import com.ashu.parking_backend.common.exception.ResourceNotFoundException;
import com.ashu.parking_backend.domain.floor.Floor;
import com.ashu.parking_backend.domain.floor.FloorRepository;
import com.ashu.parking_backend.domain.slot.dto.CreatesSlotRequest;
import com.ashu.parking_backend.domain.slot.dto.SlotResponse;
import com.ashu.parking_backend.domain.slot.dto.UpdateSlotStatusRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class ParkingSlotServiceImp implements ParkingSlotService {

    private final ParkingSlotRepository parkingSlotRepository;
    private final FloorRepository floorRepository;

    @Override
    public SlotResponse createSlot(CreatesSlotRequest request) {

        Floor floor =floorRepository.findById(request.getFloorId())
                .orElseThrow(() -> new ResourceNotFoundException("Floor not found with id: " + request.getFloorId()));


        if(parkingSlotRepository.existsBySlotNumberAndFloor_Id(
                request.getSlotNumber().trim(), request.getFloorId())){
            throw new BusinessException("Slot "+request.getSlotNumber()+" already exists");
        }

        ParkingSlot parkingSlot = ParkingSlot.builder()
                .slotNumber(request.getSlotNumber().trim().toUpperCase())
                .status(SlotStatus.AVAILABLE)   // always starts as available
                .floor(floor)
                .distanceToExit(request.getDistanceToExit())
                .distanceToElevator(request.getDistanceToElevator())
                .vipReserved(request.isVipReserved())
                .build();

        ParkingSlot saved = parkingSlotRepository.save(parkingSlot);
        log.info("Slot {} created on floor {} (mall {})",
                saved.getSlotNumber(),
                floor.getName(),
                floor.getMall().getId());

        return toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<SlotResponse> getSlotsByFloor(Long floorId) {
        return parkingSlotRepository.findAllByFloor_Id(floorId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<SlotResponse> getSlotsByMall(Long mallId) {
        return parkingSlotRepository.findAllByFloor_Mall_Id(mallId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public SlotResponse updateSlotStatus(Long id, UpdateSlotStatusRequest request) {
        ParkingSlot slot = parkingSlotRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Slot not found with id: " + id
                        )
                );

        // Business rule — don't manually change an OCCUPIED slot to AVAILABLE
        // That should only happen through the exit process
        if (slot.getStatus() == SlotStatus.OCCUPIED &&
                request.getStatus() == SlotStatus.AVAILABLE) {
            throw new BusinessException(
                    "Cannot manually mark an occupied slot as available. " +
                            "Process the vehicle exit instead."
            );
        }

        slot.setStatus(request.getStatus());
        log.info("Slot {} status updated to {}", id, request.getStatus());

        return toResponse(slot);
    }

    private SlotResponse toResponse(ParkingSlot slot) {
        return SlotResponse.builder()
                .id(slot.getId())
                .slotNumber(slot.getSlotNumber())
                .status(slot.getStatus().name())
                .floorId(slot.getFloor().getId())
                .floorName(slot.getFloor().getName())
                .distanceToExit(slot.getDistanceToExit())
                .distanceToElevator(slot.getDistanceToElevator())
                .vipReserved(slot.isVipReserved())
                .build();
    }
}
