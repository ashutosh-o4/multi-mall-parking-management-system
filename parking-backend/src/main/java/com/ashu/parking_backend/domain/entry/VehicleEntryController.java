package com.ashu.parking_backend.domain.entry;

import com.ashu.parking_backend.common.response.ApiResponse;
import com.ashu.parking_backend.domain.entry.dto.CreateEntryRequest;
import com.ashu.parking_backend.domain.entry.dto.EntryResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/entries")
@RequiredArgsConstructor
public class VehicleEntryController {

    private final VehicleEntryService vehicleEntryService;

    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<EntryResponse>> registerEntry(
            @Valid @RequestBody CreateEntryRequest request){
        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        vehicleEntryService.createEntry(request),
                        "Vehicle entry registered successfully"
                ));
    }

    @PostMapping("/{entryId}/exit")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<EntryResponse>> processExit(
            @PathVariable Long entryId) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        vehicleEntryService.processExit(entryId),
                        "Vehicle exit processed successfully"
                )
        );
    }

    @GetMapping("/mall/{mallId}/active")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OFFICER')")
    public ResponseEntity<ApiResponse<List<EntryResponse>>> getActiveEntries(
            @PathVariable Long mallId) {

        return ResponseEntity.ok(
                ApiResponse.success(
                        vehicleEntryService.getActiveEntriesByMallId(mallId)
                )
        );
    }
}
