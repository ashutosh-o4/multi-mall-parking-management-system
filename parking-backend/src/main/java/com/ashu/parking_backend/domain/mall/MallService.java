package com.ashu.parking_backend.domain.mall;

import com.ashu.parking_backend.domain.mall.dto.CreateMallRequest;
import com.ashu.parking_backend.domain.mall.dto.MallResponse;
import com.ashu.parking_backend.domain.mall.dto.UpdateMallStatusRequest;

import java.util.List;

public interface MallService {
    MallResponse createMall(CreateMallRequest request);
    MallResponse getMallById(Long id);
    List<MallResponse> getMallList();
    MallResponse updateMallStatus(Long id, UpdateMallStatusRequest request);
}
