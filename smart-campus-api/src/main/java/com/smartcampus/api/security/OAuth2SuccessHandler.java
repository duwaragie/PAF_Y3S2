package com.smartcampus.api.security;

import com.smartcampus.api.model.RefreshToken;
import com.smartcampus.api.model.User;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    
    @Value("${app.oauth2.redirect-uri}")
    private String redirectUri;
    
    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {
        
        CustomOAuth2User oauth2User = (CustomOAuth2User) authentication.getPrincipal();
        User user = oauth2User.getUser();
        
        // Generate JWT access token
        String token = jwtService.generateToken(user);
        
        // Generate Refresh token
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getId());
        
        // Build redirect URL with both tokens
        String targetUrl = UriComponentsBuilder.fromUriString(redirectUri)
                .queryParam("token", token)
                .queryParam("refreshToken", refreshToken.getToken())
                .build()
                .toUriString();
        
        getRedirectStrategy().sendRedirect(request, response, targetUrl);
    }
}
