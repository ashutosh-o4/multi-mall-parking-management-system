package com.ashu.parking_backend.domain.allocation.config;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface MallAllocationConfigRepository extends JpaRepository<MallAllocationConfig, Long> {
    @Query("select m from MallAllocationConfig m "+
            "where m.mall.id= :mallId "+
            "and m.effectiveFrom <= :now " +
            "order by m.effectiveFrom desc "+
            "limit 1")
    Optional<MallAllocationConfig> findLatestActiveConfig(@Param("mallId") long mallId,
                                                          @Param("inUse")LocalDateTime inUse);
}
