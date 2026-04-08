package com.ashu.parking_backend.domain.staff;

import com.ashu.parking_backend.domain.staff.dto.ChangePasswordRequest;
import com.ashu.parking_backend.domain.staff.dto.CreateStaffRequest;
import com.ashu.parking_backend.domain.staff.dto.StaffResponse;
import com.ashu.parking_backend.domain.staff.dto.UpdateStaffStatusRequest;

import java.util.List;

public interface StaffService {
    StaffResponse createStaff(CreateStaffRequest createStaffRequest,Long creatorId);
    StaffResponse getStaff(Long id);
    List<StaffResponse> getStaffByMall(Long mallId);
    StaffResponse updateStaffStatus(Long id, UpdateStaffStatusRequest request);
    void changePassword(Long id,ChangePasswordRequest request);
    Staff getStaffByUsername(String username);
}
