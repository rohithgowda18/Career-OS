-- Database Initialization Script for Event Application Tracker

-- Enums
DO $$ BEGIN
    CREATE TYPE event_type AS ENUM ('Hackathon', 'Workshop', 'Conference', 'Other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE status AS ENUM ('Interested', 'Applied', 'Under Review', 'Accepted', 'Rejected', 'Withdrawn');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM ('status_change', 'deadline_reminder', 'upcoming_deadline');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE view_type AS ENUM ('dashboard', 'kanban', 'list', 'calendar', 'analytics');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE profile_visibility AS ENUM ('public', 'private');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Tables
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    open_id VARCHAR(64) NOT NULL UNIQUE,
    name TEXT,
    email VARCHAR(320),
    login_method VARCHAR(64),
    role role DEFAULT 'user' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_signed_in TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS applications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_name VARCHAR(255) NOT NULL,
    event_type event_type NOT NULL,
    status status NOT NULL,
    deadline TIMESTAMPTZ,
    notes TEXT,
    url VARCHAR(2048),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS digest_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    subject VARCHAR(255) NOT NULL,
    content_summary TEXT,
    sent INTEGER DEFAULT 0 NOT NULL,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    application_id INTEGER REFERENCES applications(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    subject VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    sent INTEGER DEFAULT 0 NOT NULL,
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS user_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    default_view view_type DEFAULT 'dashboard' NOT NULL,
    notifications_enabled INTEGER DEFAULT 1 NOT NULL,
    email_notifications_enabled INTEGER DEFAULT 1 NOT NULL,
    email_deadline_reminders INTEGER DEFAULT 1 NOT NULL,
    email_status_updates INTEGER DEFAULT 1 NOT NULL,
    weekly_digest_enabled INTEGER DEFAULT 1 NOT NULL,
    digest_day VARCHAR(10) DEFAULT 'Monday' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS user_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    username VARCHAR(50) NOT NULL UNIQUE,
    bio TEXT,
    profile_visibility profile_visibility DEFAULT 'public' NOT NULL,
    show_accepted_only INTEGER DEFAULT 0 NOT NULL,
    avatar_url VARCHAR(2048),
    website_url VARCHAR(2048),
    linkedin_url VARCHAR(2048),
    twitter_handle VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS user_application_profiles (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    full_name VARCHAR(255),
    college VARCHAR(255),
    degree VARCHAR(255),
    graduation_year INTEGER,
    github_url VARCHAR(2048),
    portfolio_url VARCHAR(2048),
    resume_url VARCHAR(2048),
    skills TEXT,
    short_bio TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_open_id ON users(open_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_application_profiles_user_id ON user_application_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_applications_user_id ON applications(user_id);
