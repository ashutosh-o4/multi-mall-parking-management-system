package com.ashu.parking_backend.domain.entry.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class EntryResponse {
    private Long id;
    private String vehicleNumber;
    private Long slotId;
    private String slotNumber;
    private String floorName;
    private LocalDateTime entryTime;
    private LocalDateTime exitTime;
    private String status;
}
