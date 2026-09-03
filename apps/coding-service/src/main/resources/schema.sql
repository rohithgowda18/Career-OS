-- Coding Service Schema (career_os_coding_db)
CREATE TABLE IF NOT EXISTS coding_accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    platform VARCHAR(50) NOT NULL,
    username VARCHAR(100) NOT NULL,
    verification_code VARCHAR(50),
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    verification_expires_at TIMESTAMP,
    verified_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_coding_accounts_user_platform UNIQUE (user_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_coding_accounts_user_id ON coding_accounts(user_id);

CREATE TABLE IF NOT EXISTS coding_stats (
    id BIGSERIAL PRIMARY KEY,
    coding_account_id BIGINT NOT NULL UNIQUE REFERENCES coding_accounts(id) ON DELETE CASCADE,
    total_solved INT NOT NULL DEFAULT 0,
    easy_solved INT NOT NULL DEFAULT 0,
    medium_solved INT NOT NULL DEFAULT 0,
    hard_solved INT NOT NULL DEFAULT 0,
    rating DOUBLE PRECISION,
    current_streak INT,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_coding_stats_account_id ON coding_stats(coding_account_id);

CREATE TABLE IF NOT EXISTS coding_activity (
    id BIGSERIAL PRIMARY KEY,
    coding_account_id BIGINT NOT NULL REFERENCES coding_accounts(id) ON DELETE CASCADE,
    activity_date DATE NOT NULL,
    problems_solved INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT uq_account_activity_date UNIQUE (coding_account_id, activity_date)
);

CREATE INDEX IF NOT EXISTS idx_coding_activity_account_date ON coding_activity(coding_account_id, activity_date);
