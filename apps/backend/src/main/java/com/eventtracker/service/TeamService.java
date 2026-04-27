package com.eventtracker.service;

import com.eventtracker.entity.Application;
import com.eventtracker.entity.Team;
import com.eventtracker.entity.TeamMember;
import com.eventtracker.entity.User;
import com.eventtracker.repository.ApplicationRepository;
import com.eventtracker.repository.TeamMemberRepository;
import com.eventtracker.repository.TeamRepository;
import com.eventtracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class TeamService {

    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final ApplicationRepository applicationRepository;
    private final UserRepository userRepository;

    @Transactional
    public Team createTeam(Long applicationId, Long userId, String name, String description, Integer maxMembers) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new IllegalArgumentException("Application not found"));
        
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Team team = new Team();
        team.setName(name);
        team.setDescription(description);
        team.setApplication(application);
        team.setCreator(creator);
        team.setMaxMembers(maxMembers != null ? maxMembers : 5);
        
        team = teamRepository.save(team);

        // Add creator as lead
        addMember(team.getId(), userId, "lead");

        return team;
    }

    @Transactional
    public void addMember(Long teamId, Long userId, String role) {
        Team team = teamRepository.findById(teamId)
                .orElseThrow(() -> new IllegalArgumentException("Team not found"));
        
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        if (teamMemberRepository.findByTeamIdAndUserId(teamId, userId).isPresent()) {
            throw new IllegalStateException("User already a member of this team");
        }

        List<TeamMember> currentMembers = teamMemberRepository.findByTeamId(teamId);
        if (currentMembers.size() >= team.getMaxMembers()) {
            throw new IllegalStateException("Team is full");
        }

        TeamMember member = new TeamMember();
        member.setTeam(team);
        member.setUser(user);
        member.setRole(role != null ? role : "member");

        teamMemberRepository.save(member);
    }

    @Transactional
    public void removeMember(Long teamId, Long userId) {
        TeamMember member = teamMemberRepository.findByTeamIdAndUserId(teamId, userId)
                .orElseThrow(() -> new IllegalArgumentException("Member not found in team"));
        
        teamMemberRepository.delete(member);
    }

    public List<Team> getTeamsForApplication(Long applicationId) {
        return teamRepository.findByApplicationId(applicationId);
    }

    public List<TeamMember> getTeamMembers(Long teamId) {
        return teamMemberRepository.findByTeamId(teamId);
    }

    public List<TeamMember> getUserTeams(Long userId) {
        return teamMemberRepository.findByUserId(userId);
    }
}
