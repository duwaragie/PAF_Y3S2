package com.smartcampus.api.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenResponse {
    private String token;
    private String type = "Bearer";
    private UserDTO user;
    
    public TokenResponse(String token, UserDTO user) {
        this.token = token;
        this.type = "Bearer";
        this.user = user;
    }
}
