package com.ashu.parking_backend.domain.floor;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FloorRepository extends JpaRepository<Floor, Long> {

    List<Floor> findAllByMall_Id(Long mallId);

    boolean existsByMall_NameAndMall_Id(String name,Long mallId);
}
