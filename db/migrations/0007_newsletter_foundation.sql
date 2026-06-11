-- Migration: 0007_newsletter_foundation
-- Purpose: Create newsletter_subscribers table for the weekly automated newsletter

CREATE TABLE IF NOT EXISTS fpvlovers_app.newsletter_subscribers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT true,
    subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    unsubscribed_at TIMESTAMP WITH TIME ZONE,
    source VARCHAR(100) DEFAULT 'footer_form'
);

-- Index for quick lookups on active subscribers
CREATE INDEX idx_newsletter_active_email ON fpvlovers_app.newsletter_subscribers(is_active, email);

-- Campaigns Archive
CREATE TABLE IF NOT EXISTS fpvlovers_app.newsletter_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject VARCHAR(255) NOT NULL,
    content_html TEXT NOT NULL,
    content_md TEXT,
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, failed
    sent_at TIMESTAMP WITH TIME ZONE,
    recipient_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
