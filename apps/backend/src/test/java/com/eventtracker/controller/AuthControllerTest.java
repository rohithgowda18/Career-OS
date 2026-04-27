package com.eventtracker.controller;

import com.eventtracker.entity.User;
import com.eventtracker.dto.UserDTO;
import com.eventtracker.exception.DuplicateUserException;
import com.eventtracker.security.JwtTokenProvider;
import com.eventtracker.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

import java.util.Optional;

import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class AuthControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private JwtTokenProvider tokenProvider;

    @Mock
    private PasswordEncoder passwordEncoder;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders
                .standaloneSetup(new AuthController(userService, tokenProvider, passwordEncoder))
                .setValidator(validator)
                .build();
    }

    @Test
    void registerSucceedsForValidPayload() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setEmail("rohit@gmail.com");
        user.setUsername("rohit18");
        user.setIsActive(true);

        UserDTO userDTO = new UserDTO();
        userDTO.setId(1L);
        userDTO.setEmail("rohit@gmail.com");
        userDTO.setUsername("rohit18");

        when(userService.createUser("rohit@gmail.com", "StrongPass123", null, null, "rohit18")).thenReturn(user);
        when(tokenProvider.generateToken(1L, "rohit@gmail.com")).thenReturn("jwt-token");
        when(tokenProvider.getJwtExpirationMillis()).thenReturn(86400000L);
        when(userService.convertToDTO(user)).thenReturn(userDTO);

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "rohit18",
                                  "email": "rohit@gmail.com",
                                  "password": "StrongPass123"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token", is("jwt-token")))
                .andExpect(jsonPath("$.user.username", is("rohit18")));
    }

    @Test
    void registerReturnsConflictForDuplicateEmail() throws Exception {
        when(userService.createUser(eq("rohit@gmail.com"), eq("StrongPass123"), any(), any(), eq("rohit18")))
                .thenThrow(new DuplicateUserException("Email already exists"));

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "rohit18",
                                  "email": "rohit@gmail.com",
                                  "password": "StrongPass123"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", is("Email already exists")));
    }

    @Test
    void registerReturnsConflictForDuplicateUsername() throws Exception {
        when(userService.createUser(eq("rohit@gmail.com"), eq("StrongPass123"), any(), any(), eq("rohit18")))
                .thenThrow(new DuplicateUserException("Username already exists"));

        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "rohit18",
                                  "email": "rohit@gmail.com",
                                  "password": "StrongPass123"
                                }
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", is("Username already exists")));
    }

    @Test
    void registerRejectsInvalidEmail() throws Exception {
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "rohit18",
                                  "email": "not-an-email",
                                  "password": "StrongPass123"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Email should be valid")));
    }

    @Test
    void registerRejectsWeakPassword() throws Exception {
        mockMvc.perform(post("/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "username": "rohit18",
                                  "email": "rohit@gmail.com",
                                  "password": "123"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", is("Password must be between 6 and 128 characters")));
    }

    @Test
    void loginSucceedsForValidCredentials() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setEmail("rohit@gmail.com");
        user.setUsername("rohit18");
        user.setPassword("$2a$10$hash");
        user.setIsActive(true);

        when(userService.findByEmail("rohit@gmail.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("StrongPass123", "$2a$10$hash")).thenReturn(true);
        when(tokenProvider.generateToken(1L, "rohit@gmail.com")).thenReturn("jwt-token");
        when(tokenProvider.getJwtExpirationMillis()).thenReturn(86400000L);
        UserDTO userDTO = new UserDTO();
        userDTO.setId(1L);
        userDTO.setEmail("rohit@gmail.com");
        userDTO.setUsername("rohit18");
        when(userService.convertToDTO(user)).thenReturn(userDTO);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "rohit@gmail.com",
                                  "password": "StrongPass123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", is("jwt-token")))
                .andExpect(jsonPath("$.user.email", is("rohit@gmail.com")));
    }

    @Test
    void loginRejectsWrongPassword() throws Exception {
        User user = new User();
        user.setId(1L);
        user.setEmail("rohit@gmail.com");
        user.setPassword("$2a$10$hash");

        when(userService.findByEmail("rohit@gmail.com")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("WrongPass123", "$2a$10$hash")).thenReturn(false);

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "rohit@gmail.com",
                                  "password": "WrongPass123"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    void loginRejectsUnknownEmail() throws Exception {
        when(userService.findByEmail("missing@gmail.com")).thenReturn(Optional.empty());

        mockMvc.perform(post("/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "missing@gmail.com",
                                  "password": "StrongPass123"
                                }
                                """))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }
}
