package com.ashu.parking_backend.domain.mall;

import com.ashu.parking_backend.common.response.ApiResponse;
import com.ashu.parking_backend.domain.mall.dto.CreateMallRequest;
import com.ashu.parking_backend.domain.mall.dto.MallResponse;
import com.ashu.parking_backend.domain.mall.dto.UpdateMallStatusRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/malls")
@RequiredArgsConstructor
public class MallController {

    private final MallService mallService;

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<MallResponse>> createMall(
            @Valid @RequestBody CreateMallRequest request){

        MallResponse response=mallService.createMall(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(response, "Mall created successfully"));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<MallResponse>> getMallById(
            @PathVariable Long id){

        return ResponseEntity.ok(ApiResponse.success(mallService.getMallById(id)));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
    public ResponseEntity<ApiResponse<List<MallResponse>>> getAllMalls(){

        return ResponseEntity.ok(ApiResponse.success(mallService.getMallList()));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<MallResponse>> updateMallStatus(
            @PathVariable Long id,
            @Valid @RequestBody UpdateMallStatusRequest request){

        return ResponseEntity.ok(ApiResponse.success(mallService.updateMallStatus(id, request),"Mall status updated"));
    }
}
