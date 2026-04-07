package com.ashu.parking_backend.common.security;

import com.ashu.parking_backend.common.enums.StaffStatus;
import com.ashu.parking_backend.domain.staff.Staff;
import com.ashu.parking_backend.domain.staff.StaffRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final StaffRepository staffRepository;

    @Override
    public UserDetails loadUserByUsername(String username)
            throws UsernameNotFoundException {

        Staff staff = staffRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Staff not found with username: " + username));

        if(staff.getStatus() == StaffStatus.INACTIVE){
            throw new UsernameNotFoundException("Staff account is inactive: " + username);
        }

        return User.withUsername(staff.getUsername())
                .password(staff.getPassword())
                .authorities("ROLE_"+staff.getRole().name())
                .build();
    }
}
