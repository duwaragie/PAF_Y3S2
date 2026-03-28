package com.smartcampus.api.security;

import com.smartcampus.api.model.User;
import lombok.AllArgsConstructor;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.user.OAuth2User;

import java.util.Collection;
import java.util.Collections;
import java.util.Map;

@AllArgsConstructor
@Getter
public class CustomOAuth2User implements OAuth2User {
    
    private User user;
    private Map<String, Object> attributes;
    
    @Override
    public Map<String, Object> getAttributes() {
        return attributes;
    }
    
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return Collections.singletonList(
                new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
        );
    }
    
    @Override
    public String getName() {
        return user.getEmail();
    }
}
