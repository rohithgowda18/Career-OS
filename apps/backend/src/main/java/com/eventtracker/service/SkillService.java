package com.eventtracker.service;

import com.eventtracker.dto.CreateSkillRequest;
import com.eventtracker.dto.SkillDTO;
import com.eventtracker.dto.UpdateSkillRequest;
import com.eventtracker.entity.Skill;
import com.eventtracker.entity.User;
import com.eventtracker.exception.DuplicateSkillException;
import com.eventtracker.repository.SkillRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class SkillService {
    private final SkillRepository skillRepository;

    public Skill createSkill(User user, CreateSkillRequest request) {
        String trimmedName = request.getName().trim();
        if (skillRepository.existsByUserIdAndNameIgnoreCase(user.getId(), trimmedName)) {
            throw new DuplicateSkillException("You have already added this skill: " + trimmedName);
        }

        Skill skill = new Skill();
        skill.setUser(user);
        skill.setName(trimmedName);
        skill.setCategory(request.getCategory());
        skill.setLevel(request.getLevel());

        return skillRepository.save(skill);
    }

    public Skill updateSkill(Long id, Long userId, UpdateSkillRequest request) {
        Skill skill = skillRepository.findById(id)
                .filter(s -> s.getUser().getId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("Skill not found"));

        String trimmedName = request.getName().trim();
        Optional<Skill> existing = skillRepository.findByUserIdAndNameIgnoreCase(userId, trimmedName);
        if (existing.isPresent() && !existing.get().getId().equals(id)) {
            throw new DuplicateSkillException("You have already added this skill: " + trimmedName);
        }

        skill.setName(trimmedName);
        skill.setCategory(request.getCategory());
        skill.setLevel(request.getLevel());

        return skillRepository.save(skill);
    }

    @Transactional(readOnly = true)
    public Page<SkillDTO> getUserSkills(Long userId, String search, Pageable pageable) {
        Page<Skill> skillsPage;
        if (search != null && !search.trim().isEmpty()) {
            skillsPage = skillRepository.findByUserIdAndNameContainingIgnoreCase(userId, search.trim(), pageable);
        } else {
            skillsPage = skillRepository.findByUserId(userId, pageable);
        }
        return skillsPage.map(this::convertToDTO);
    }

    @Transactional(readOnly = true)
    public Optional<Skill> getSkillById(Long id, Long userId) {
        return skillRepository.findById(id)
                .filter(s -> s.getUser().getId().equals(userId));
    }

    public void deleteSkill(Long id, Long userId) {
        Skill skill = skillRepository.findById(id)
                .filter(s -> s.getUser().getId().equals(userId))
                .orElseThrow(() -> new IllegalArgumentException("Skill not found"));
        skillRepository.delete(skill);
    }

    public SkillDTO convertToDTO(Skill skill) {
        return new SkillDTO(
                skill.getId(),
                skill.getName(),
                skill.getCategory(),
                skill.getLevel(),
                skill.getCreatedAt(),
                skill.getUpdatedAt()
        );
    }
}
