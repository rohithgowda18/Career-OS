package com.eventtracker.security.oauth;

import com.eventtracker.entity.User;
import com.eventtracker.security.JwtTokenProvider;
import com.eventtracker.service.UserService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class OAuth2LoginSuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final JwtTokenProvider jwtTokenProvider;
    private final UserService userService;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException {
        String sanitizedFrontendUrl = frontendUrl.trim();
        try {
            log.info("OAuth2 login successful, processing principal. Frontend URL: {}", sanitizedFrontendUrl);
            OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();
            log.debug("OAuth2 Attributes: {}", oauthUser.getAttributes());

            String email = oauthUser.getAttribute("email");
            if (email == null) {
                email = oauthUser.getAttribute("login");
            }

            if (email == null || email.isBlank()) {
                log.error("OAuth2 provider did not return an email or login attribute");
                response.sendRedirect(sanitizedFrontendUrl + "/login?error=email_not_found");
                return;
            }

            final String finalEmail = email;
            log.info("Processing login for email: {}", finalEmail);

            User user = userService.findByEmail(finalEmail)
                    .orElseGet(() -> {
                        log.info("Creating new user for OAuth email: {}", finalEmail);
                        return userService.createUser(finalEmail, "oauth-user");
                    });

            String token = jwtTokenProvider.generateToken(user.getId(), user.getEmail());
            String redirectUrl = sanitizedFrontendUrl + "/oauth-success?token=" + token;

            log.info("Redirecting to frontend success page");
            getRedirectStrategy().sendRedirect(request, response, redirectUrl);

        } catch (Exception e) {
            log.error("Critical error in OAuth2LoginSuccessHandler", e);
            response.sendRedirect(sanitizedFrontendUrl + "/login?error=internal_server_error");
        }
    }
}

