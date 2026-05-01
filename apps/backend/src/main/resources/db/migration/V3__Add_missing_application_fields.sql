-- V3: Add missing columns to applications table
-- These columns were missing in the initial schema applied to the database

ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS event_type VARCHAR(50) DEFAULT 'Hackathon' NOT NULL,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'Interested' NOT NULL;
