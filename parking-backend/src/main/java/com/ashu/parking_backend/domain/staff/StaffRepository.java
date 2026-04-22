package com.ashu.parking_backend.domain.staff;

import com.ashu.parking_backend.common.enums.Role;
import com.ashu.parking_backend.common.enums.StaffStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface StaffRepository extends JpaRepository<Staff, Long> {

    Optional<Staff> findByUsername(String username);

    boolean existsByUsername(String username);

    List<Staff> findAllByMall_Id(Long mall_Id);

    List<Staff> findAllByMall_IdAndRole(Long mallId, Role role);

    List<Staff> findAllByMall_IdAndStatus(Long mallId, StaffStatus status);
}
