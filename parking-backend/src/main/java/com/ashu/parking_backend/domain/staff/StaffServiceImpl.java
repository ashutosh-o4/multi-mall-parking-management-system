package com.ashu.parking_backend.domain.staff;

import com.ashu.parking_backend.common.enums.Role;
import com.ashu.parking_backend.common.enums.StaffStatus;
import com.ashu.parking_backend.common.exception.BusinessException;
import com.ashu.parking_backend.domain.mall.Mall;
import com.ashu.parking_backend.domain.mall.MallRepository;
import com.ashu.parking_backend.domain.staff.dto.ChangePasswordRequest;
import com.ashu.parking_backend.domain.staff.dto.CreateStaffRequest;
import com.ashu.parking_backend.domain.staff.dto.StaffResponse;
import com.ashu.parking_backend.domain.staff.dto.UpdateStaffStatusRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.ResourceAccessException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class StaffServiceImpl implements StaffService {

    private final StaffRepository staffRepository;
    private final MallRepository mallRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public StaffResponse createStaff(CreateStaffRequest request, Long creatorId) {
        log.info("Staff creation requested by Staff Id: {}", creatorId);

        Staff creator = staffRepository.findById(creatorId)
                .orElseThrow(()-> new ResourceAccessException(("Creator not found")));

        if(staffRepository.existsByUsername(request.getUsername().trim())){
            throw new BusinessException("Username " + request.getUsername() + " already exists");
        }


        validateRoleCreationPermission(creator.getRole(), request.getRole());

        Mall mall = null;

        if(request.getMallId() != null){
            mall=mallRepository.findById(request.getMallId()).orElseThrow(()->new BusinessException("Mall not found with id: " + request.getMallId()));

            //SUPER_ADMIN cannot be assigned to a mall
            if(request.getRole() == Role.SUPER_ADMIN){
                throw new BusinessException("SUPER ADMIN cannot be assigned to a mall");
            }
        }
        else{
            //if no mall provided, role must be SUPER_ADMIN
            if(request.getRole() != Role.SUPER_ADMIN){
                throw new BusinessException("Mall Id is required for ADMIN and OFFICER roles");
            }
        }

        Staff staff = Staff.builder()
                .username(request.getUsername().trim().toLowerCase())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .mall(mall)
                .status(StaffStatus.ACTIVE)
                .build();

        Staff savedStaff = staffRepository.save(staff);
        log.info("Staff created with id: {},role: {}", savedStaff.getId(),savedStaff.getRole());
        return toResponse(savedStaff);
    }

    @Override
    @Transactional(readOnly = true)
    public StaffResponse getStaff(Long id) {
        Staff staff=staffRepository.findById(id).orElseThrow(()-> new ResourceAccessException(("Staff not found with id: " + id)));
        return toResponse(staff);
    }

    @Override
    @Transactional(readOnly = true)
    public List<StaffResponse> getStaffByMall(Long mallId) {
        return staffRepository.findAllByMall_Id(mallId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public StaffResponse updateStaffStatus(Long id, UpdateStaffStatusRequest request) {

        Staff staff=staffRepository.findById(id).orElseThrow(()-> new ResourceAccessException(("Staff not found with id: " + id)));

        staff.setStatus(request.getStatus());
        log.info("Staff {} status updated to {}",id, staff.getStatus());
        return toResponse(staff);
    }

    @Override
    public void changePassword(Long staffId,ChangePasswordRequest request) {

        Staff staff=staffRepository.findById(staffId).orElseThrow(()-> new ResourceAccessException(("Staff not found")));

        if(!passwordEncoder.matches(request.getCurrentPassword(), staff.getPassword())){
            throw new BusinessException("Current Password does not match");
        }

        staff.setPassword(passwordEncoder.encode(request.getNewPassword()));
        log.info("Password changed for Staff Id: {}", staffId);
    }

    @Override
    @Transactional(readOnly = true)
    public Staff getStaffByUsername(String username) {
        return staffRepository.findByUsername(username).orElseThrow(()-> new ResourceAccessException(("Staff not found: " + username)));
    }

    private void validateRoleCreationPermission(Role creatorRole,Role targetRole){
        if(creatorRole == Role.SUPER_ADMIN && targetRole == Role.ADMIN) return;
        if(creatorRole == Role.ADMIN && targetRole == Role.OFFICER) return;
        throw new BusinessException("You do not have permission to create staff member with role: "+targetRole);
    }

    private StaffResponse toResponse(Staff staff){
        return StaffResponse.builder()
                .id(staff.getId())
                .username(staff.getUsername())
                .role(staff.getRole().name())
                .status(staff.getStatus().name())
                .mallId(staff.getMall() !=null ? staff.getMall().getId() : null)
                .mallName(staff.getMall() !=null ?staff.getMall().getName() : null)
                .createdAt(staff.getCreatedAt())
                .build();
    }
}
