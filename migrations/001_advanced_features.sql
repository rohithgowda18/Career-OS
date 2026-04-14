-- Advanced Features Database Migration
-- Run this script to add all necessary tables and enums for the 5 advanced features

-- =====================================================
-- ENUMS
-- =====================================================

DO $$ BEGIN
    CREATE TYPE team_role AS ENUM ('lead', 'member', 'mentor');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE skill_level AS ENUM ('beginner', 'intermediate', 'advanced', 'expert');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- ALTER EXISTING TABLES FOR NEW FEATURES
-- =====================================================

-- Feature 1: AI Personalized Recommendations
-- Add columns to user_application_profiles for skills and interests
ALTER TABLE user_application_profiles 
ADD COLUMN IF NOT EXISTS skills_json JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS interests JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS experience_level skill_level DEFAULT 'intermediate',
ADD COLUMN IF NOT EXISTS preferred_event_types JSONB DEFAULT '["Hackathon", "Workshop"]',
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(50);

-- =====================================================
-- NEW TABLES
-- =====================================================

-- Feature 2: Team Formation System
-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    created_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    max_members INTEGER DEFAULT 5 NOT NULL,
    status VARCHAR(50) DEFAULT 'active' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Team Members junction table
CREATE TABLE IF NOT EXISTS team_members (
    id SERIAL PRIMARY KEY,
    team_id INTEGER NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role team_role DEFAULT 'member' NOT NULL,
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(team_id, user_id)
);

-- =====================================================
-- Feature 3: Smart Calendar with Conflict Detection
-- =====================================================

CREATE TABLE IF NOT EXISTS calendar_conflicts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id_1 INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    application_id_2 INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    conflict_date_start TIMESTAMPTZ NOT NULL,
    conflict_date_end TIMESTAMPTZ NOT NULL,
    recommended_application_id INTEGER REFERENCES applications(id),
    resolved INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- =====================================================
-- Feature 4: Predictive Success Scoring
-- =====================================================

CREATE TABLE IF NOT EXISTS event_success_scores (
    id SERIAL PRIMARY KEY,
    application_id INTEGER NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    success_probability DECIMAL(5, 2) NOT NULL,
    score_factors JSONB NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE(application_id, user_id)
);

-- =====================================================
-- INDEXES (for performance optimization)
-- =====================================================

-- Teams indexes
CREATE INDEX IF NOT EXISTS idx_teams_application_id ON teams(application_id);
CREATE INDEX IF NOT EXISTS idx_teams_created_by ON teams(created_by);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);

-- Team Members indexes
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- Calendar Conflicts indexes
CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_user_id ON calendar_conflicts(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_resolved ON calendar_conflicts(resolved) WHERE resolved = 0;
CREATE INDEX IF NOT EXISTS idx_calendar_conflicts_dates ON calendar_conflicts(conflict_date_start, conflict_date_end);

-- Event Success Scores indexes
CREATE INDEX IF NOT EXISTS idx_event_success_scores_user_id ON event_success_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_event_success_scores_application_id ON event_success_scores(application_id);
CREATE INDEX IF NOT EXISTS idx_event_success_scores_probability ON event_success_scores(success_probability DESC);

-- User Application Profiles indexes (for recommendations)
CREATE INDEX IF NOT EXISTS idx_user_app_profiles_skills ON user_application_profiles USING GIN(skills_json);
CREATE INDEX IF NOT EXISTS idx_user_app_profiles_interests ON user_application_profiles USING GIN(interests);
CREATE INDEX IF NOT EXISTS idx_user_app_profiles_experience ON user_application_profiles(experience_level);

-- =====================================================
-- VIEWS (Optional but helpful for analytics)
-- =====================================================

-- View for team statistics
CREATE OR REPLACE VIEW team_statistics AS
SELECT 
    t.id,
    t.name,
    t.application_id,
    t.created_by,
    COUNT(tm.id) as member_count,
    t.max_members,
    ROUND(CAST(COUNT(tm.id) AS DECIMAL) / t.max_members * 100, 2) as fill_percentage,
    t.created_at
FROM teams t
LEFT JOIN team_members tm ON t.id = tm.team_id
GROUP BY t.id, t.name, t.application_id, t.created_by, t.max_members, t.created_at;

-- View for user success metrics
CREATE OR REPLACE VIEW user_success_metrics AS
SELECT 
    u.id as user_id,
    u.name,
    COUNT(a.id) as total_applications,
    COUNT(CASE WHEN a.status = 'Accepted' THEN 1 END) as accepted_count,
    COUNT(CASE WHEN a.status = 'Rejected' THEN 1 END) as rejected_count,
    COUNT(CASE WHEN a.status = 'Under Review' THEN 1 END) as under_review_count,
    ROUND(CAST(COUNT(CASE WHEN a.status = 'Accepted' THEN 1 END) AS DECIMAL) / 
          NULLIF(COUNT(a.id), 0) * 100, 2) as acceptance_rate,
    MAX(ess.success_probability) as highest_success_probability,
    AVG(ess.success_probability) as avg_success_probability
FROM users u
LEFT JOIN applications a ON u.id = a.user_id
LEFT JOIN event_success_scores ess ON u.id = ess.user_id
GROUP BY u.id, u.name;

-- =====================================================
-- TRIGGERS (Optional: for automatic timestamp updates)
-- =====================================================

-- Teams updated_at trigger
CREATE OR REPLACE FUNCTION update_teams_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS teams_updated_at_trigger ON teams;
CREATE TRIGGER teams_updated_at_trigger
    BEFORE UPDATE ON teams
    FOR EACH ROW
    EXECUTE FUNCTION update_teams_timestamp();

-- =====================================================
-- INITIAL DATA (Optional)
-- =====================================================

-- You can add sample data here for testing if needed
-- INSERT INTO ... SELECT ...;

-- =====================================================
-- VERIFY SCHEMA
-- =====================================================

-- Run these queries to verify the schema was created correctly:
-- SELECT * FROM information_schema.tables WHERE table_type = 'BASE TABLE' AND table_schema = 'public';
-- SELECT * FROM information_schema.columns WHERE table_name IN ('teams', 'team_members', 'calendar_conflicts', 'event_success_scores');

