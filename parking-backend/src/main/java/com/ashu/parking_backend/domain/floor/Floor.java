package com.ashu.parking_backend.domain.floor;

import com.ashu.parking_backend.common.BaseEntity;
import com.ashu.parking_backend.domain.mall.Mall;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="floor")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Floor extends BaseEntity {

    @Column(name="name",nullable = false)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="mall_id",nullable = false)
    private Mall mall;

}
