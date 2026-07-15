package com.eventtracker.security.oauth;

import com.eventtracker.entity.User;
import com.eventtracker.security.JwtTokenProvider;
import com.eventtracker.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;

    @Value("${app.oauth2.redirect-url}")
    private String oauth2RedirectUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

        String email = oauthUser.getAttribute("email");
        if (email == null) {
            email = oauthUser.getAttribute("login");
        }

        final String finalEmail = email;
        String name = oauthUser.getAttribute("name");

        User user = userService.findByEmail(finalEmail)
                .map(u -> {
                    if ((u.getDisplayName() == null || u.getDisplayName().isBlank()) && name != null) {
                        return userService.updateDisplayName(u.getId(), name);
                    }
                    return u;
                })
                .orElseGet(() -> userService.createUser(finalEmail, "oauth-user", name));

        String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail());

        String sanitizedUrl = oauth2RedirectUrl.trim()
                .replace("\"", "")
                .replace("'", "")
                .replaceAll("[\\r\\n]", "");
        String redirectUrl = sanitizedUrl + "?token=" + token;

        getRedirectStrategy().sendRedirect(request, response, redirectUrl);
    }
}

