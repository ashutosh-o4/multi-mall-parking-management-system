package com.ashu.parking_backend.domain.mall;

import com.ashu.parking_backend.common.enums.MallStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface MallRepository extends JpaRepository<Mall, Long> {

    public boolean existsByName(String name);

    Optional<Mall> findByName(String name);

    List<Mall> findAllByStatus(MallStatus status);

}
