package com.eventtracker.service;

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
import com.eventtracker.util.UrlUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
public class PlacementService {
    private final PlacementRepository placementRepository;

    public Placement createPlacement(User user, PlacementDTO request) {
        String normLink = UrlUtils.normalizeUrl(request.getApplicationLink());
        placementRepository.findDuplicate(user.getId(), request.getCompanyName(), request.getRole(), normLink)
            .ifPresent(p -> {
                throw new DuplicatePlacementException("Placement for this company and role with this link is already saved in your tracker");
            });

        Placement placement = new Placement();
        placement.setUser(user);
        placement.setCompanyName(request.getCompanyName());
        placement.setRole(request.getRole());
        placement.setLocation(request.getLocation());
        placement.setStipend(request.getStipend());
        placement.setCtc(request.getCtc());
        placement.setApplicationLink(normLink);
        placement.setAssessmentDate(request.getAssessmentDate());
        placement.setInterviewDate(request.getInterviewDate());
        placement.setStatus(parseStatus(request.getStatus()));

        return placementRepository.save(placement);
    }

    public Optional<Placement> findById(Long id, Long userId) {
        return placementRepository.findByIdAndUserId(id, userId);
    }

    public Page<PlacementDTO> getUserPlacements(Long userId, String status, String search, Pageable pageable) {
        PlacementStatus placementStatus = null;
        if (status != null && !status.trim().isEmpty() && !status.equalsIgnoreCase("ALL")) {
            placementStatus = parseStatus(status);
        }
        String searchPattern = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

        return placementRepository.findFiltered(userId, placementStatus, searchPattern, pageable)
                .map(this::convertToDTO);
    }

    public List<PlacementDTO> getUserPlacementsByStatus(Long userId, String status) {
        PlacementStatus placementStatus = parseStatus(status);
        return placementRepository.findByUserIdAndStatusOrderByIdDesc(userId, placementStatus)
                .stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public Placement updatePlacement(Long id, Long userId, PlacementDTO request) {
        Placement placement = placementRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new IllegalArgumentException("Placement not found"));

        // Check if there is another entry with the same company, role & link
        String normLink = UrlUtils.normalizeUrl(request.getApplicationLink());
        placementRepository.findDuplicate(userId, request.getCompanyName(), request.getRole(), normLink)
            .ifPresent(p -> {
                if (!p.getId().equals(id)) {
                    throw new DuplicatePlacementException("Placement for this company and role with this link is already saved in your tracker");
                }
            });

        placement.setCompanyName(request.getCompanyName());
        placement.setRole(request.getRole());
        placement.setLocation(request.getLocation());
        placement.setStipend(request.getStipend());
        placement.setCtc(request.getCtc());
        placement.setApplicationLink(normLink);
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
        if (status == null) return PlacementStatus.APPLIED;
        String normalized = status.trim().replaceAll(" ", "").replaceAll("_", "");
        for (PlacementStatus s : PlacementStatus.values()) {
            if (s.name().replaceAll("_", "").equalsIgnoreCase(normalized)) return s;
        }
        return PlacementStatus.APPLIED;
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
        dto.setAssessmentDate(p.getAssessmentDate());
        dto.setInterviewDate(p.getInterviewDate());
        dto.setStatus(p.getStatus().toString());
        dto.setCreatedAt(p.getCreatedAt());
        dto.setUpdatedAt(p.getUpdatedAt());
        return dto;
    }
}
