package com.ashu.parking_backend.common;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@MappedSuperclass
@Getter
@Setter
public class BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @CreationTimestamp
    @Column(name="created_at" , updatable = false, nullable = false)
    private LocalDateTime createdAt;


    @UpdateTimestamp
    @Column(name="updated_at" , nullable = false)
    private LocalDateTime updatedAt;
}
