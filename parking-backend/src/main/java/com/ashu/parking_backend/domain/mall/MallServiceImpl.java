package com.ashu.parking_backend.domain.mall;

import com.ashu.parking_backend.common.enums.MallStatus;
import com.ashu.parking_backend.common.exception.BusinessException;
import com.ashu.parking_backend.domain.mall.dto.CreateMallRequest;
import com.ashu.parking_backend.domain.mall.dto.MallResponse;
import com.ashu.parking_backend.domain.mall.dto.UpdateMallStatusRequest;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class MallServiceImpl implements MallService {

    private final MallRepository mallRepository;

    @Override
    public MallResponse createMall(CreateMallRequest request) {
        log.info("Creating mall with name: {}", request.getName());

        if (mallRepository.existsByName(request.getName().trim())) {
            throw new BusinessException("Mall with name " + request.getName() + " already exists");
        }

        Mall mall = Mall.builder()
                .name(request.getName().trim())
                .address(request.getAddress().trim())
                .status(MallStatus.ACTIVE)
                .build();

        Mall savedMall = mallRepository.save(mall);
        log.info("Mall with name: {} has been created", savedMall.getName());

        return toResponse(savedMall);
    }

    @Override
    @Transactional(readOnly = true)
    public MallResponse getMallById(Long id) {
        Mall mall = mallRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Mall with id " + id + " not found"));
        return toResponse(mall);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MallResponse> getMallList() {
        return mallRepository.findAll()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public MallResponse updateMallStatus(Long id, UpdateMallStatusRequest request) {
        Mall mall = mallRepository.findById(id)
                .orElseThrow(() -> new BusinessException("Mall with id " + id + " not found"));

        mall.setStatus(request.getStatus());
        // No need to call save() explicitly here
        // The entity is managed - changes is flushed automatically at transaction
        // commit
        log.info("Mall with id: {} has been updated to {}", id, request.getStatus());

        return toResponse(mall);
    }

    // Used private Mapper-keeps mapping logic close to where it's used

    private MallResponse toResponse(Mall mall) {
        return MallResponse.builder()
                .id(mall.getId())
                .name(mall.getName())
                .address(mall.getAddress())
                .status(mall.getStatus().name())
                .createdAt(mall.getCreatedAt())
                .build();
    }
}
