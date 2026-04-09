package com.ashu.parking_backend.config;

import com.ashu.parking_backend.common.enums.Role;
import com.ashu.parking_backend.common.enums.StaffStatus;
import com.ashu.parking_backend.domain.staff.Staff;
import com.ashu.parking_backend.domain.staff.StaffRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@RequiredArgsConstructor
@Component
@Slf4j
public class DataSeeder implements ApplicationRunner {

    private final StaffRepository staffRepository;
    private final PasswordEncoder  passwordEncoder;

    @Override
    public void run(ApplicationArguments args) throws Exception {

        //creating SUPER_ADMIN
        boolean superAdminExists=staffRepository
                .findByUsername("superadmin")
                .isPresent();

        if(!superAdminExists){
            Staff superAdmin = Staff.builder()
                    .username("superadmin")
                    .password(passwordEncoder.encode("ashu1234"))
                    .role(Role.SUPER_ADMIN)
                    .mall(null)
                    .status(StaffStatus.ACTIVE)
                    .build();

            staffRepository.save(superAdmin);
            log.info("=====================================");
            log.info("SUPER_ADMIN created successfully");
            log.info("Username: superadmin");
            log.info("Password: ashu1234");
            log.info("Change this password");
            log.info("====================================");
        }
        else{
            log.info("SUPER_ADMIN already exists");
        }

    }
}
