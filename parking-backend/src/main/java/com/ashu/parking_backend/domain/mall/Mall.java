package com.ashu.parking_backend.domain.mall;

import com.ashu.parking_backend.common.BaseEntity;
import com.ashu.parking_backend.common.enums.MallStatus;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="mall")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Mall extends BaseEntity {

    @Column(name="name", nullable=false, unique=true,length=150)
    private String name;

    @Column(name="address", nullable = false ,length = 300)
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(name="status",nullable = false)
    private MallStatus status;

}