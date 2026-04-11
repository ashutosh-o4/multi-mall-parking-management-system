package com.ashu.parking_backend.config;

import com.ashu.parking_backend.common.security.JwtAuthFilter;
import com.ashu.parking_backend.common.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter  jwtAuthFilter;
    private final UserDetailsServiceImpl userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .csrf(AbstractHttpConfigurer::disable)
                //disable csrf-we're stateless , jwt handles security

                .sessionManagement(session->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                //no session - every request must carry its own jwt

                .authorizeHttpRequests(auth-> auth

                        //Swagger/OpenAPI

                        .requestMatchers(
                                "/swagger-ui/**",
                                "/swagger-ui.html",
                                "/v3/api-docs/**",
                                "/v3/api-docs"
                        ).permitAll()


                        //public endpoints-no token needed
                        .requestMatchers("/auth/login").permitAll()
                        .requestMatchers("actuator/health").permitAll()

                        //SUPER_ADMIN only
                        .requestMatchers(HttpMethod.POST,"/malls/**").hasRole("SUPER_ADMIN")
                        .requestMatchers(HttpMethod.PATCH,"/malls/**").hasRole("SUPER_ADMIN")
                        .requestMatchers(HttpMethod.GET,"/malls/**").hasAnyRole("SUPER_ADMIN","ADMIN")

                        //ADMIN and above
                        .requestMatchers("/floors/**")
                        .hasAnyRole("SUPER_ADMIN", "ADMIN")
                        .requestMatchers("/slots/**")
                        .hasAnyRole("SUPER_ADMIN", "ADMIN")
                        .requestMatchers("/staff/**")
                        .hasAnyRole("SUPER_ADMIN", "ADMIN")

                        //OFFICER and above
                        .requestMatchers("/entries/**")
                        .hasAnyRole("SUPER_ADMIN", "ADMIN", "OFFICER")

                        //Everyone else requires authentication
                        .anyRequest().authenticated()
                )

                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider daoAuthenticationProvider = new DaoAuthenticationProvider();
        daoAuthenticationProvider.setUserDetailsService(userDetailsService);
        daoAuthenticationProvider.setPasswordEncoder(passwordEncoder());
        return daoAuthenticationProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}
