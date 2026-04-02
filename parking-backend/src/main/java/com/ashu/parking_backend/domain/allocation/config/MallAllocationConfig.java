package com.ashu.parking_backend.domain.allocation.config;

import com.ashu.parking_backend.common.BaseEntity;
import com.ashu.parking_backend.domain.mall.Mall;
import jakarta.persistence.*;
import lombok.*;


import java.time.LocalDateTime;

@Entity
@Table(name="mall_allocation_config")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MallAllocationConfig extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="mall_id",nullable = false)
    private Mall mall;

    @Column(name="weight_exit", nullable = false)
    private Double weightExit;

    @Column(name="weight_elevator", nullable = false)
    private Double weightElevator;

    @Column(name="vip_bonus", nullable = false)
    private Double vipBonus;

    @Column(name="effective_from", nullable = false)
    private LocalDateTime effectiveFrom;
}
