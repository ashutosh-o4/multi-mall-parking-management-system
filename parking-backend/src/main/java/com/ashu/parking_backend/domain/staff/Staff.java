package com.ashu.parking_backend.domain.staff;

import com.ashu.parking_backend.common.BaseEntity;
import com.ashu.parking_backend.common.enums.Role;
import com.ashu.parking_backend.common.enums.StaffStatus;
import com.ashu.parking_backend.domain.mall.Mall;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name="staff")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Staff extends BaseEntity {

    @Column(name = "username" , nullable = false, unique = true,length = 100)
    private String username;

    @Column(name = "password", nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private Role role;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="mall_id", nullable = true) //Super-admin has no mall
    private Mall mall;

    @Enumerated(EnumType.STRING)
    @Column(name="status" , nullable = false)
    private StaffStatus staffStatus;
}