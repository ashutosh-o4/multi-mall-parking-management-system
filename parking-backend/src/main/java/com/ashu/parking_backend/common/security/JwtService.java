package com.ashu.parking_backend.common.security;

import com.ashu.parking_backend.domain.staff.Staff;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwt;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.function.Function;

@Service
@Slf4j
public class JwtService {

    @Value("${app.jwt.secret}")
    private String jwtSecret;

    @Value("${app.jwt.expiration-ms}")
    private long jwtExpirationMs;

    //Generate a token for a successfully authenticated staff member
    public String generateToken(Staff staff){
        return Jwts.builder()
                .subject(staff.getUsername())
                .claim("role",staff.getRole().name())
                .claim("mallId",staff.getMall()!=null
                        ? staff.getMall().getId() :null)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis()+ jwtExpirationMs))
                .signWith(getSigningKey())
                .compact();
    }

    public String extractUsername(String token){
        return extractClaim(token,Claims::getSubject);
    }

    public String extractRole(String token){
        return extractClaim(token,claims ->  claims.get("role",String.class));
    }

    public boolean isTokenValid(String token, UserDetails userDetails){
        try{
            final String username=extractUsername(token);
            return username.equals(userDetails.getUsername())
                    && !isTokenExpired(token);
        }
        catch (JwtException e){
            log.warn("JWT validation failed:{}",e.getMessage());
            return false;
        }
    }

    private boolean isTokenExpired(String token){
        return extractClaim(token,Claims::getExpiration).before(new Date());
    }

    private <T> T extractClaim(String token , Function<Claims,T> claimsResolver){
        final Claims claims=extractClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractClaims(String token){
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token).getPayload();
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64URL.decode(jwtSecret);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
