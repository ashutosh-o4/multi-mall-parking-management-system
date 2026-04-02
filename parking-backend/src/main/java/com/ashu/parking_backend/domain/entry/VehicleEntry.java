package com.ashu.parking_backend.domain.entry;

import com.ashu.parking_backend.common.BaseEntity;
import com.ashu.parking_backend.common.enums.EntryStatus;
import com.ashu.parking_backend.domain.mall.Mall;
import com.ashu.parking_backend.domain.slot.ParkingSlot;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name="vehicle_entry")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VehicleEntry extends BaseEntity {

    @Column(name="vehicle_number",nullable = false)
    private String vehicleNumber;

    @Column(name="entry_time",nullable = false)
    private LocalDateTime entryTime;

    @Column(name="exit_time")
    private LocalDateTime exitTime;

    @Enumerated(EnumType.STRING)
    @Column(name="status",nullable = false)
    private EntryStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="slot_id",nullable = false)
    private ParkingSlot slot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="mall_id",nullable = false)
    private Mall mall;

}
