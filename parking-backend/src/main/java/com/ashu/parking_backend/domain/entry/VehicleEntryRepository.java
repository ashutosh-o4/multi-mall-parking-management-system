package com.ashu.parking_backend.domain.entry;

import com.ashu.parking_backend.common.enums.EntryStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VehicleEntryRepository extends JpaRepository<VehicleEntry, Long> {

    Optional<VehicleEntry> findByVehicleNumberAndStatus(String vehicleNumber, EntryStatus status);

    List<VehicleEntry> findAllByMall_Id(long mall_Id);

    Optional <VehicleEntry> findBySlot_IdAndStatus(long slot_Id, EntryStatus status);

    @Query("SELECT v FROM VehicleEntry v WHERE v.mall.id = :mallId " +
            "AND v.status= 'ACTIVE' "+
            "ORDER BY v.entryTime DESC")
    List<VehicleEntry> findActiveEntriesByMallId(@Param("mallId") long mallId);
}
