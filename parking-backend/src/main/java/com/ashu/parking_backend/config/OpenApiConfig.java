package com.ashu.parking_backend.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI parkingManagementOpenAPI() {
         return new OpenAPI()
                 .info(new Info()
                         .title("Multi-Mall Parking Management System API")
                         .description(
                                 "AI-Driven parking management backend supporting " +
                                         "multi-tenant mall operations, role-based access control, " +
                                         "and smart slot allocation via Strategy Pattern."
                         )
                         .version("1.0.0")
                         .contact(new Contact()
                                 .name("Ashutosh Saklani")
                                 .email("ashutoshsaklani28@gmail.com")
                         )
                 )
                 //For JWT input field
                 .addSecurityItem(new SecurityRequirement()
                         .addList("Bearer Authentication"))
                 .components(new Components()
                         .addSecuritySchemes("Bearer Authentication",
                                 new SecurityScheme()
                                         .type(SecurityScheme.Type.HTTP)
                                         .scheme("bearer")
                                         .bearerFormat("JWT")
                                         .description(
                                                 "Enter your JWT token. " +
                                                         "Get it from POST /auth/login")));

    }
}
