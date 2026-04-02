package com.ashu.parking_backend.domain.slot;

import com.ashu.parking_backend.common.BaseEntity;
import com.ashu.parking_backend.common.enums.SlotStatus;
import com.ashu.parking_backend.domain.floor.Floor;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="parking_slot")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParkingSlot extends BaseEntity {

    @Column(name="slot_number",nullable = false)
    private String slotNumber;

    @Enumerated(EnumType.STRING)
    @Column(name="status",nullable = false)
    private SlotStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="floor_id",nullable = false)
    private Floor floor;

    @Column(name="distance_to_exit",nullable = false)
    private Integer distanceToExit;

    @Column(name="distance_to_elevator",nullable = false)
    private Integer distanceToElevator;

    @Column(name="vip_reserved", nullable = false)
    private boolean vipReserved=false;
}
