-- Create Users table
CREATE TABLE IF NOT EXISTS fpvlovers_app.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    email_verified TIMESTAMP WITH TIME ZONE,
    image VARCHAR(255),
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'pilot',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Accounts table (OAuth credentials mapping)
CREATE TABLE IF NOT EXISTS fpvlovers_app.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES fpvlovers_app.users(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at BIGINT,
    token_type VARCHAR(255),
    scope VARCHAR(255),
    id_token TEXT,
    session_state VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT provider_unique UNIQUE (provider, provider_account_id)
);

-- Create explicit index on accounts.user_id to prevent Seq Scans
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON fpvlovers_app.accounts(user_id);

-- Create Sessions table (optional for JWT but required by standard pg adapter structures)
CREATE TABLE IF NOT EXISTS fpvlovers_app.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_token VARCHAR(255) NOT NULL UNIQUE,
    user_id UUID NOT NULL REFERENCES fpvlovers_app.users(id) ON DELETE CASCADE,
    expires TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create explicit index on sessions.user_id to prevent Seq Scans
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON fpvlovers_app.sessions(user_id);

-- Create Verification Tokens table
CREATE TABLE IF NOT EXISTS fpvlovers_app.verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- Create Pilot Progress table (JSONB milestones & quizzes)
CREATE TABLE IF NOT EXISTS fpvlovers_app.pilot_progress (
    user_id UUID PRIMARY KEY REFERENCES fpvlovers_app.users(id) ON DELETE CASCADE,
    completed_steps JSONB NOT NULL DEFAULT '[]',
    quiz_scores JSONB NOT NULL DEFAULT '{}',
    current_specialization VARCHAR(100) DEFAULT 'Beginner',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
