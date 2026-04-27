-- V1__Initial_schema.sql
-- Create users table
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    oauth_id VARCHAR(255),
    oauth_provider VARCHAR(255),
    oauth_email VARCHAR(255),
    oauth_name VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    bio TEXT,
    profile_picture_url VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_oauth_id ON users(oauth_id);

-- Create user_preferences table
CREATE TABLE user_preferences (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    deadline_reminders BOOLEAN DEFAULT true,
    digest_frequency VARCHAR(255) DEFAULT 'weekly',
    preferred_event_types VARCHAR(255),
    timezone VARCHAR(255) DEFAULT 'UTC',
    theme VARCHAR(255) DEFAULT 'light',
    language VARCHAR(255) DEFAULT 'en',
    receive_recommendations BOOLEAN DEFAULT true
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Create user_profiles table
CREATE TABLE user_profiles (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    username VARCHAR(255),
    bio TEXT,
    profile_picture_url VARCHAR(255),
    github_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    portfolio_url VARCHAR(255),
    twitter_handle VARCHAR(255),
    total_applications INTEGER DEFAULT 0,
    successful_applications INTEGER DEFAULT 0,
    success_rate DOUBLE PRECISION DEFAULT 0.0,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_username ON user_profiles(username);
CREATE INDEX idx_user_profiles_is_public ON user_profiles(is_public);

-- Create applications table
CREATE TABLE applications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_name VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    deadline TIMESTAMP,
    notes TEXT,
    event_url VARCHAR(255),
    success_score DOUBLE PRECISION,
    is_favorite BOOLEAN DEFAULT false,
    rejection_reason TEXT,
    application_link VARCHAR(255),
    tags VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_applications_user_id ON applications(user_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_event_type ON applications(event_type);
CREATE INDEX idx_applications_deadline ON applications(deadline);
CREATE INDEX idx_applications_is_favorite ON applications(is_favorite);
