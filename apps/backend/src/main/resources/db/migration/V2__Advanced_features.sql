-- V2__Advanced_features.sql
-- Add missing tables and columns for migration from old Node server

-- Feature 1: AI Personalized Recommendations
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS skills_json JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS experience_level VARCHAR(50) DEFAULT 'intermediate',
ADD COLUMN IF NOT EXISTS preferred_event_types JSONB DEFAULT '["Hackathon", "Workshop"]',
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50);

-- Feature 2: Team Formation System
CREATE TABLE IF NOT EXISTS teams (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    created_by BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_members INTEGER DEFAULT 5 NOT NULL,
    status VARCHAR(50) DEFAULT 'active' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS team_members (
    id BIGSERIAL PRIMARY KEY,
    team_id BIGINT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(team_id, user_id)
);

-- Feature 3: Smart Calendar with Conflict Detection
CREATE TABLE IF NOT EXISTS calendar_conflicts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id_1 BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    application_id_2 BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    conflict_date_start TIMESTAMP NOT NULL,
    conflict_date_end TIMESTAMP NOT NULL,
    recommended_application_id BIGINT REFERENCES applications(id),
    is_resolved BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Feature 4: Predictive Success Scoring
CREATE TABLE IF NOT EXISTS event_success_scores (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    success_probability DOUBLE PRECISION NOT NULL,
    score_factors JSONB NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(application_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_application_id ON teams(application_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_user_id ON calendar_conflicts(user_id);
CREATE INDEX IF NOT EXISTS idx_event_success_scores_user_id ON event_success_scores(user_id);
