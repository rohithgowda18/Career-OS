package com.eventtracker.controller;

import com.eventtracker.dto.ResumeDTO;
import com.eventtracker.entity.Resume;
import com.eventtracker.entity.User;
import com.eventtracker.service.ResumeService;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ResumeService resumeService;

    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return (User) authentication.getPrincipal();
        }
        throw new RuntimeException("User not authenticated");
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(operationId = "uploadResume", summary = "Upload a new PDF resume")
    public ResponseEntity<?> upload(
            @RequestParam("name") String name,
            @RequestParam("file") MultipartFile file) {
        User user = getCurrentUser();
        try {
            Resume resume = resumeService.uploadResume(user, name, file);
            return ResponseEntity.status(HttpStatus.CREATED).body(resumeService.convertToDTO(resume));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Resume upload failed", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to upload resume: " + e.getMessage()));
        }
    }

    @GetMapping
    @Operation(operationId = "listResumes", summary = "List all resumes of the authenticated user")
    public ResponseEntity<List<ResumeDTO>> list() {
        User user = getCurrentUser();
        return ResponseEntity.ok(resumeService.listMyResumes(user.getId()));
    }

    @GetMapping("/{id}")
    @Operation(operationId = "getResume", summary = "Get resume details by ID")
    public ResponseEntity<?> get(@PathVariable Long id) {
        User user = getCurrentUser();
        try {
            Resume resume = resumeService.getResume(id, user.getId());
            return ResponseEntity.ok(resumeService.convertToDTO(resume));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}/rename")
    @Operation(operationId = "renameResume", summary = "Rename a resume")
    public ResponseEntity<?> rename(@PathVariable Long id, @RequestBody Map<String, String> request) {
        User user = getCurrentUser();
        String newName = request.get("name");
        try {
            Resume resume = resumeService.renameResume(id, user.getId(), newName);
            return ResponseEntity.ok(resumeService.convertToDTO(resume));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    @Operation(operationId = "deleteResume", summary = "Delete a resume")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        User user = getCurrentUser();
        try {
            resumeService.deleteResume(id, user.getId());
            return ResponseEntity.ok(Map.of("message", "Resume deleted successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/{id}/download")
    @Operation(operationId = "downloadResume", summary = "Download a resume PDF file")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        User user = getCurrentUser();
        try {
            Resume resume = resumeService.getResume(id, user.getId());
            Path path = Paths.get(resume.getFilePath());
            Resource resource = new UrlResource(path.toUri());
            if (!resource.exists() || !resource.isReadable()) {
                throw new RuntimeException("Resume file not found or not readable");
            }
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + resume.getFileName() + "\"")
                    .contentType(MediaType.APPLICATION_PDF)
                    .body(resource);
        } catch (Exception e) {
            log.error("Failed to download resume ID: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
