package com.ashu.parking_backend.domain.slot.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class SlotResponse {
    private Long id;
    private String slotNumber;
    private String status;
    private Long floorId;
    private String floorName;
    private Integer distanceToExit;
    private Integer distanceToElevator;
    private Boolean vipReserved;
}
