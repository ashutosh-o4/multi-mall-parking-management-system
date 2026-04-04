package com.ashu.parking_backend.domain.entry;

import com.ashu.parking_backend.common.enums.EntryStatus;
import com.ashu.parking_backend.common.enums.SlotStatus;
import com.ashu.parking_backend.common.exception.BusinessException;
import com.ashu.parking_backend.common.exception.ResourceNotFoundException;
import com.ashu.parking_backend.domain.allocation.config.MallAllocationConfig;
import com.ashu.parking_backend.domain.allocation.config.MallAllocationConfigRepository;
import com.ashu.parking_backend.domain.allocation.strategy.SlotAllocationStrategy;
import com.ashu.parking_backend.domain.entry.dto.CreateEntryRequest;
import com.ashu.parking_backend.domain.entry.dto.EntryResponse;
import com.ashu.parking_backend.domain.mall.Mall;
import com.ashu.parking_backend.domain.mall.MallRepository;
import com.ashu.parking_backend.domain.slot.ParkingSlot;
import com.ashu.parking_backend.domain.slot.ParkingSlotRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.ResourceAccessException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class VehicleEntryServiceImpl implements VehicleEntryService {

    private final VehicleEntryRepository vehicleEntryRepository;
    private final ParkingSlotRepository parkingSlotRepository;
    private final MallRepository mallRepository;
    private final MallAllocationConfigRepository  mallAllocationConfigRepository;
    private final SlotAllocationStrategy firstAvailableStrategy;
    private final SlotAllocationStrategy smartAllocationStrategy;


    @Override
    public EntryResponse createEntry(CreateEntryRequest request) {

        log.info("Vehicle entry requested:{} at mall: {}",request.getVehicleNumber(),request.getMallId());

        Mall mall= mallRepository.findById(request.getMallId()).orElseThrow(()->new ResourceNotFoundException("Mall not found with id: "+request.getMallId()));

        //Vehicle can not enter if already parked
        vehicleEntryRepository.findByVehicleNumberAndStatus(
                request.getVehicleNumber().toUpperCase().trim(),
                EntryStatus.ACTIVE).ifPresent(entry->{
                    throw new BusinessException(
                            "Vehicle "+request.getVehicleNumber()+" is already parked at slot:" +entry.getSlot().getSlotNumber()
                    );
        });

        //fetch available slots with pessimistic lock
        List<ParkingSlot> availableSlots = parkingSlotRepository
                .findAvailableSlotsByMallIdWithLock(request.getMallId());

        if(availableSlots.isEmpty()){
            throw new BusinessException("No available parking slot found in mall: " +mall.getName());
        }

        //which strategy to use
        ParkingSlot selectedSlot= selectSlot(availableSlots, request.getMallId());

        //update slot status
        selectedSlot.setStatus(SlotStatus.OCCUPIED);

        //create entry record
        VehicleEntry entry =VehicleEntry.builder()
                .vehicleNumber(request.getVehicleNumber().toUpperCase().trim())
                .entryTime(LocalDateTime.now())
                .status(EntryStatus.ACTIVE)
                .slot(selectedSlot)
                .mall(mall)
                .build();

        VehicleEntry saved=vehicleEntryRepository.save(entry);

        log.info("Vehicle {} assigned to slot {} (id:{})",
                request.getVehicleNumber(),request.getMallId(),saved.getId());

        return toResponse(saved);
    }

    @Override
    public EntryResponse processExit(Long entryId) {
        VehicleEntry entry = vehicleEntryRepository.findById(entryId).orElseThrow
                (()-> new ResourceAccessException("Entry not found with id : " + entryId));

        if(entry.getStatus() == EntryStatus.CLOSED) {
            throw new BusinessException("This vehicle has already exited");
        }

        //Free up the slot
        entry.getSlot().setStatus(SlotStatus.AVAILABLE);

        //close the entry
        entry.setExitTime(LocalDateTime.now());
        entry.setStatus(EntryStatus.CLOSED);

        log.info("Vehicle {} exited from slot {}",entry.getVehicleNumber(), entry.getSlot().getSlotNumber());
        return toResponse(entry);
    }

    @Override
    public List<EntryResponse> getActiveEntriesByMallId(Long mallId) {
        return vehicleEntryRepository.findActiveEntriesByMallId(mallId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    //select selection logic
    private ParkingSlot selectSlot(List<ParkingSlot> availableParkingSlots, Long mallId) {
        Optional<MallAllocationConfig> config = mallAllocationConfigRepository
                .findLatestActiveConfig(mallId, LocalDateTime.now());

        if(config.isPresent()) {
            log.info("Using Smart Allocation Strategy for mall: {}", mallId);
            return smartAllocationStrategy.selectParkingSlot(availableParkingSlots, config.get());
        }

        log.info("No active config found-using First Available Strategy for mall: {}", mallId);
        return firstAvailableStrategy.selectParkingSlot(availableParkingSlots, null);
    }


    private EntryResponse toResponse(VehicleEntry entry) {
        return EntryResponse.builder()
                .id(entry.getId())
                .vehicleNumber(entry.getVehicleNumber())
                .slotId(entry.getSlot().getId())
                .slotNumber(entry.getSlot().getSlotNumber())
                .floorName(entry.getSlot().getFloor().getName())
                .entryTime(entry.getEntryTime())
                .exitTime(entry.getExitTime())
                .status(entry.getStatus().name())
                .build();
    }
}
