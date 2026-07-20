-- USERS (Authentication only)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'USER' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);


-- USER PROFILES (Autofill data)
CREATE TABLE IF NOT EXISTS user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    college VARCHAR(255),
    skills TEXT,
    github_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    portfolio_url VARCHAR(255),
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- APPLICATIONS (Core feature)
CREATE TABLE IF NOT EXISTS applications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_name VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    deadline TIMESTAMP,
    notes TEXT,
    event_url VARCHAR(255),
    location VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Ensure user cannot save the same event URL twice (Idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_event_url ON applications (user_id, event_url);

-- PLACEMENTS (Core feature)
CREATE TABLE IF NOT EXISTS placements (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    stipend VARCHAR(255),
    ctc VARCHAR(255),
    application_link VARCHAR(255),
    assessment_date TIMESTAMP,
    interview_date TIMESTAMP,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_placements_status ON placements(status);
DROP INDEX IF EXISTS unique_user_company_role;
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_company_role_link ON placements (user_id, company_name, role, application_link);

UPDATE placements SET status = 'APPLIED' WHERE status = 'SAVED';

-- Add preference fields to user_profiles table if they don't exist
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS email_alerts BOOLEAN DEFAULT TRUE NOT NULL;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS weekly_digest BOOLEAN DEFAULT FALSE NOT NULL;

-- SKILLS (New feature)
CREATE TABLE IF NOT EXISTS skills (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    level VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_user_skill ON skills (user_id, name);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS display_name VARCHAR(255);

DROP TABLE IF EXISTS resumes CASCADE;

-- ROUTINE TASKS (New feature)
CREATE TABLE IF NOT EXISTS routine_tasks (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_routine_tasks_user_id ON routine_tasks(user_id);

CREATE TABLE IF NOT EXISTS routine_completion (
    id BIGSERIAL PRIMARY KEY,
    routine_task_id BIGINT NOT NULL REFERENCES routine_tasks(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL,
    completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_routine_completion UNIQUE (routine_task_id, completion_date)
);




