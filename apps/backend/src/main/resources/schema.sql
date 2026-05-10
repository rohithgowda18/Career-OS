-- FORCE RESET (One-time fix for Render database contamination)
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- USERS (Authentication only)
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'USER' NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

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

CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);

-- Ensure user cannot save the same event URL twice (Idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_event_url ON applications (user_id, event_url);

-- FIX: Convert custom enum types to VARCHAR to match JPA/Hibernate expectations
-- This resolves "column is of type event_type but expression is of type character varying"
DO $$ 
BEGIN
    -- Fix event_type
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='event_type') THEN
        ALTER TABLE applications ALTER COLUMN event_type TYPE VARCHAR(50) USING event_type::VARCHAR;
    END IF;

    -- Fix status
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='applications' AND column_name='status') THEN
        ALTER TABLE applications ALTER COLUMN status TYPE VARCHAR(50) USING status::VARCHAR;
    END IF;
END $$;
