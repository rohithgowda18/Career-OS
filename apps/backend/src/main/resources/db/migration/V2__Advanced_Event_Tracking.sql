-- V2 Schema update: Advanced Event Tracking
-- Adds support for multi-stage timelines, prizes, team sizes and location

-- 1. Add new columns to applications table
ALTER TABLE applications 
ADD COLUMN location VARCHAR(255),
ADD COLUMN prize_pool VARCHAR(255),
ADD COLUMN min_team_size INTEGER,
ADD COLUMN max_team_size INTEGER;

-- 2. Create Application Timeline table
CREATE TABLE application_timeline (
    id BIGSERIAL PRIMARY KEY,
    application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
    stage_name VARCHAR(255) NOT NULL,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    is_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_application_timeline_app_id ON application_timeline(application_id);
