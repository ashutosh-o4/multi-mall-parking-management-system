package com.ashu.parking_backend.domain.staff;

import com.ashu.parking_backend.common.response.ApiResponse;
import com.ashu.parking_backend.domain.staff.dto.ChangePasswordRequest;
import com.ashu.parking_backend.domain.staff.dto.CreateStaffRequest;
import com.ashu.parking_backend.domain.staff.dto.StaffResponse;
import com.ashu.parking_backend.domain.staff.dto.UpdateStaffStatusRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/staff")
@RequiredArgsConstructor
public class StaffController {

        private final StaffService staffService;

        @PostMapping
        @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
        public ResponseEntity<ApiResponse<StaffResponse>> createStaff(
                        @Valid @RequestBody CreateStaffRequest request,
                        @AuthenticationPrincipal UserDetails currentUser) {

                // get the creator's id from the security context
                // the service uses this to enforce role hierarchy

                Staff creator = staffService.getStaffByUsername(currentUser.getUsername());

                return ResponseEntity.status(HttpStatus.CREATED)
                                .body(ApiResponse.success(
                                                staffService.createStaff(request, creator.getId()),
                                                "Staff created successfully"));
        }

        @GetMapping("/{id}")
        @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
        public ResponseEntity<ApiResponse<StaffResponse>> getStaffById(
                        @PathVariable Long id) {

                return ResponseEntity.ok(
                                ApiResponse.success(staffService.getStaff(id)));
        }

        @GetMapping("/mall/{mallId}")
        @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
        public ResponseEntity<ApiResponse<StaffResponse>> getStaffByMallId(
                        @PathVariable Long mallId) {

                return ResponseEntity.ok(
                                ApiResponse.success(staffService.getStaff(mallId)));
        }

        @PatchMapping("/{id}/status")
        @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN')")
        public ResponseEntity<ApiResponse<StaffResponse>> updateStaffStatus(
                        @PathVariable Long id,
                        @Valid @RequestBody UpdateStaffStatusRequest request) {

                return ResponseEntity.ok(
                                ApiResponse.success(staffService.updateStaffStatus(id, request),
                                                "Staff status updated successfully"));
        }

        @PutMapping("/change-password")
        @PreAuthorize("hasAnyRole('SUPER_ADMIN', 'ADMIN', 'OFFICER')")
        public ResponseEntity<ApiResponse<StaffResponse>> changePassword(
                        @Valid @RequestBody ChangePasswordRequest request,
                        @AuthenticationPrincipal UserDetails currentUser) {

                Staff staff = staffService.getStaffByUsername(currentUser.getUsername());
                staffService.changePassword(staff.getId(), request);

                return ResponseEntity.ok(
                                ApiResponse.success(null, "Password changed successfully"));
        }

        @GetMapping
        @PreAuthorize("hasRole('SUPER_ADMIN')")
        public ResponseEntity<ApiResponse<List<StaffResponse>>> getAllStaff(){
            return ResponseEntity.ok(
                    ApiResponse.success(staffService.getAllStaff())
            );
        }

}
