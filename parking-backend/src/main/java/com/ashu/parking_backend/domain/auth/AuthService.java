package com.ashu.parking_backend.domain.auth;

import com.ashu.parking_backend.common.security.JwtService;
import com.ashu.parking_backend.domain.auth.dto.LoginRequest;
import com.ashu.parking_backend.domain.auth.dto.LoginResponse;
import com.ashu.parking_backend.domain.staff.Staff;
import com.ashu.parking_backend.domain.staff.StaffRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final StaffRepository staffRepository;
    private final JwtService jwtService;

    public LoginResponse login(LoginRequest request){
        //1. load the user via UserDetailService
        //2. verifies the password with BCrypt
        //3. Throws BadCredentialException if wrong

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.getUsername(),
                        request.getPassword()
                )
        );

        //if we reach here authentication succeeded
        Staff staff = staffRepository.findByUsername(request.getUsername())
                .orElseThrow(()->new ResourceAccessException("Staff not found"));

        String token = jwtService.generateToken(staff);
        log.info("Login successful for user: {}", staff.getUsername());

        return LoginResponse.builder()
                .token(token)
                .username(staff.getUsername())
                .role(staff.getRole().name())
                .mallId(staff.getMall() != null ? staff.getMall().getId():null)
                .build();
    }
}
