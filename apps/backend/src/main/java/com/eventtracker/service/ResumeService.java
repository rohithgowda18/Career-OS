package com.eventtracker.service;

import com.eventtracker.dto.ResumeDTO;
import com.eventtracker.entity.Resume;
import com.eventtracker.entity.User;
import com.eventtracker.repository.ResumeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final Path storageDirectory = Paths.get("uploads").toAbsolutePath().normalize();

    public Resume uploadResume(User user, String name, MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty");
        }
        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename();
        
        // Validation: PDF only
        if (contentType == null || !contentType.equalsIgnoreCase("application/pdf") || originalFilename == null || !originalFilename.toLowerCase().endsWith(".pdf")) {
            throw new IllegalArgumentException("Only PDF files are allowed");
        }

        // Create upload directory
        Files.createDirectories(this.storageDirectory);

        // Generate safe unique filename
        String safeName = UUID.randomUUID().toString() + "_" + originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
        Path targetLocation = this.storageDirectory.resolve(safeName);
        Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

        Resume resume = new Resume();
        resume.setUser(user);
        resume.setName(name != null && !name.trim().isEmpty() ? name.trim() : originalFilename);
        resume.setFilePath(targetLocation.toString());
        resume.setFileName(originalFilename);
        resume.setFileSize(file.getSize());

        return resumeRepository.save(resume);
    }

    public List<ResumeDTO> listMyResumes(Long userId) {
        return resumeRepository.findByUserId(userId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Resume getResume(Long id, Long userId) {
        return resumeRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Resume not found or access denied"));
    }

    public Resume renameResume(Long id, Long userId, String newName) {
        if (newName == null || newName.trim().isEmpty()) {
            throw new IllegalArgumentException("Resume name cannot be empty");
        }
        Resume resume = getResume(id, userId);
        resume.setName(newName.trim());
        return resumeRepository.save(resume);
    }

    public void deleteResume(Long id, Long userId) {
        Resume resume = getResume(id, userId);
        
        // Delete file on disk if exists
        try {
            Path filePath = Paths.get(resume.getFilePath());
            Files.deleteIfExists(filePath);
        } catch (IOException e) {
            // Log warning but continue deleting database record
        }

        resumeRepository.delete(resume);
    }

    public ResumeDTO convertToDTO(Resume resume) {
        ResumeDTO dto = new ResumeDTO();
        dto.setId(resume.getId());
        dto.setUserId(resume.getUser().getId());
        dto.setName(resume.getName());
        dto.setFilePath(resume.getFilePath());
        dto.setFileName(resume.getFileName());
        dto.setFileSize(resume.getFileSize());
        dto.setCreatedAt(resume.getCreatedAt());
        return dto;
    }
}
