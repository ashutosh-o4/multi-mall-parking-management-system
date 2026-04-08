package com.ashu.parking_backend.domain.slot;

import com.ashu.parking_backend.common.enums.MallStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, Long> {

    List<ParkingSlot> findAllByFloor_Id(Long floorId);

    List<ParkingSlot> findAllByFloor_Mall_Id(Long mallId);

    boolean existsBySlotNumberAndFloor_Id(String slotNumber, Long floorId);

    @Query("SELECT s FROM ParkingSlot s WHERE s.floor.mall.id = :mallId " +
            "AND s.status = 'AVAILABLE' " +
            "ORDER BY s.id ASC")
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    List<ParkingSlot> findAvailableSlotsByMallIdWithLock(@Param("mallId")Long mallId);

    @Query("SELECT COUNT(s) FROM ParkingSlot s WHERE s.floor.mall.id = :mallId " +
            "And s.status = :status")
    long countByMallIdAndStatus(@Param("mallId") Long mallId,@Param("status") MallStatus status);
}
