package com.smartcampus.api.dto;

import com.smartcampus.api.model.Role;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String email;
    private String name;
    private String picture;
    private Role role;
}
