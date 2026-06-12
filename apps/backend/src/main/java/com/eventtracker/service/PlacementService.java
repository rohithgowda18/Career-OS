package com.eventtracker.service;

import com.eventtracker.dto.CreatePlacementRequest;
import com.eventtracker.dto.UpdatePlacementRequest;
import com.eventtracker.dto.PlacementDTO;
import com.eventtracker.entity.Placement;
import com.eventtracker.entity.PlacementStatus;
import com.eventtracker.entity.User;
import com.eventtracker.exception.DuplicatePlacementException;
import com.eventtracker.repository.PlacementRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PlacementService {
    private final PlacementRepository placementRepository;

    public Placement createPlacement(User user, CreatePlacementRequest request) {
        placementRepository.findByUserIdAndCompanyNameAndRole(user.getId(), request.getCompanyName(), request.getRole())
            .ifPresent(p -> {
                throw new DuplicatePlacementException("Placement for this company and role is already saved in your tracker");
            });

        Placement placement = new Placement();
        placement.setUser(user);
        placement.setCompanyName(request.getCompanyName());
        placement.setRole(request.getRole());
        placement.setLocation(request.getLocation());
        placement.setStipend(request.getStipend());
        placement.setCtc(request.getCtc());
        placement.setApplicationLink(normalizeUrl(request.getApplicationLink()));
        placement.setRegistrationDeadline(request.getRegistrationDeadline());
        placement.setAssessmentDate(request.getAssessmentDate());
        placement.setInterviewDate(request.getInterviewDate());
        placement.setStatus(parseStatus(request.getStatus()));

        return placementRepository.save(placement);
    }

    public Optional<Placement> findById(Long id, Long userId) {
        return placementRepository.findByIdAndUserId(id, userId);
    }

    public Page<PlacementDTO> getUserPlacements(Long userId, Pageable pageable) {
        return placementRepository.findByUserId(userId, pageable)
                .map(this::convertToDTO);
    }

    public List<PlacementDTO> getUserPlacementsByStatus(Long userId, String status) {
        PlacementStatus placementStatus = parseStatus(status);
        return placementRepository.findByUserIdAndStatusOrderByRegistrationDeadlineAsc(userId, placementStatus)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Placement updatePlacement(Long id, Long userId, UpdatePlacementRequest request) {
        Placement placement = placementRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Placement not found"));

        // Check if there is another entry with the same company & role
        placementRepository.findByUserIdAndCompanyNameAndRole(userId, request.getCompanyName(), request.getRole())
            .ifPresent(p -> {
                if (!p.getId().equals(id)) {
                    throw new DuplicatePlacementException("Placement for this company and role is already saved in your tracker");
                }
            });

        placement.setCompanyName(request.getCompanyName());
        placement.setRole(request.getRole());
        placement.setLocation(request.getLocation());
        placement.setStipend(request.getStipend());
        placement.setCtc(request.getCtc());
        placement.setApplicationLink(normalizeUrl(request.getApplicationLink()));
        placement.setRegistrationDeadline(request.getRegistrationDeadline());
        placement.setAssessmentDate(request.getAssessmentDate());
        placement.setInterviewDate(request.getInterviewDate());
        placement.setStatus(parseStatus(request.getStatus()));

        return placementRepository.save(placement);
    }

    public void deletePlacement(Long id, Long userId) {
        Placement placement = placementRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Placement not found"));
        placementRepository.delete(placement);
    }

    private PlacementStatus parseStatus(String status) {
        if (status == null) return PlacementStatus.SAVED;
        String normalized = status.trim().replaceAll(" ", "").replaceAll("_", "");
        for (PlacementStatus s : PlacementStatus.values()) {
            if (s.name().replaceAll("_", "").equalsIgnoreCase(normalized)) return s;
        }
        return PlacementStatus.SAVED;
    }

    private String normalizeUrl(String url) {
        if (url == null || url.isBlank()) return null;
        String normalized = url.trim().toLowerCase();
        int queryIndex = normalized.indexOf('?');
        if (queryIndex != -1) {
            normalized = normalized.substring(0, queryIndex);
        }
        if (normalized.endsWith("/")) {
            normalized = normalized.substring(0, normalized.length() - 1);
        }
        return normalized;
    }

    public PlacementDTO convertToDTO(Placement p) {
        PlacementDTO dto = new PlacementDTO();
        dto.setId(p.getId());
        dto.setUserId(p.getUser().getId());
        dto.setCompanyName(p.getCompanyName());
        dto.setRole(p.getRole());
        dto.setLocation(p.getLocation());
        dto.setStipend(p.getStipend());
        dto.setCtc(p.getCtc());
        dto.setApplicationLink(p.getApplicationLink());
        dto.setRegistrationDeadline(p.getRegistrationDeadline());
        dto.setAssessmentDate(p.getAssessmentDate());
        dto.setInterviewDate(p.getInterviewDate());
        dto.setStatus(p.getStatus().toString());
        dto.setCreatedAt(p.getCreatedAt());
        dto.setUpdatedAt(p.getUpdatedAt());
        return dto;
    }
}
