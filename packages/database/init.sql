-- =========================================================
-- GroundWave (groundwave.fm) Production Database Schema
-- Identity vs Entity Model: Users, Creator Entities & Team Memberships
-- Extensions: PostGIS (Spatial) & pgvector (Recommendations)
-- =========================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. INDIVIDUAL USERS (Personal Human Identity & Auth)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL, -- personal handle: e.g. @maya_guitar
    display_name VARCHAR(100) NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    h3_index_res8 VARCHAR(15), -- Obfuscated location (~1km resolution)
    city_name VARCHAR(100),
    country_code CHAR(2),
    scene_radius_miles INTEGER DEFAULT 15,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    is_platform_admin BOOLEAN DEFAULT FALSE,
    has_founder_package BOOLEAN DEFAULT FALSE,
    stripe_customer_id VARCHAR(100) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATOR ENTITIES (Bands, Solo Artists, Labels, Curators, Venues)
CREATE TABLE IF NOT EXISTS creator_entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slug VARCHAR(50) UNIQUE NOT NULL, -- public entity handle: e.g. @static_veins, @midwest_pressings
    name VARCHAR(100) NOT NULL,
    entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('solo_artist', 'band', 'label', 'curator', 'venue')),
    bio TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    city_name VARCHAR(100),
    country_code CHAR(2),
    scene_radius_miles INTEGER DEFAULT 15,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    h3_index_res8 VARCHAR(15),
    stripe_account_id VARCHAR(100) UNIQUE,
    payouts_enabled BOOLEAN DEFAULT FALSE,
    community_guidelines TEXT,
    allow_fan_posts BOOLEAN DEFAULT TRUE,
    require_mod_approval BOOLEAN DEFAULT FALSE,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'pending', 'verified', 'suspended')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENTITY TEAM MEMBERSHIPS & PERMISSIONS (Multi-User Control)
CREATE TABLE IF NOT EXISTS entity_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_id UUID NOT NULL REFERENCES creator_entities(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'moderator', 'finance_manager')),
    member_title VARCHAR(50), -- e.g. "Lead Vocals", "Label Founder", "Street Team Captain"
    royalty_split_pct DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entity_id, user_id)
);

-- 4. LABEL ROSTER RELATIONSHIPS
CREATE TABLE IF NOT EXISTS label_roster_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label_entity_id UUID NOT NULL REFERENCES creator_entities(id) ON DELETE CASCADE,
    artist_entity_id UUID NOT NULL REFERENCES creator_entities(id) ON DELETE CASCADE,
    contract_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    contract_end_date DATE,
    default_royalty_split_pct DECIMAL(5,2) DEFAULT 50.00,
    can_manage_releases BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(label_entity_id, artist_entity_id)
);

-- 5. RELEASES & SOUND RECORDINGS (DDEX Aligned)
CREATE TABLE IF NOT EXISTS releases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_entity_id UUID NOT NULL REFERENCES creator_entities(id) ON DELETE CASCADE,
    label_entity_id UUID REFERENCES creator_entities(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    release_type VARCHAR(20) NOT NULL CHECK (release_type IN ('single', 'ep', 'album', 'label_compilation', 'stem_pack', 'live_bootleg')),
    cover_art_url TEXT NOT NULL,
    release_date DATE NOT NULL DEFAULT CURRENT_DATE,
    upc_ean_code VARCHAR(20), -- DDEX: Universal Product Code
    is_exclusive_to_tier UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DDEX "SoundRecording" (The physical audio asset, independent of release mapping)
CREATE TABLE IF NOT EXISTS sound_recordings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    duration_seconds INT NOT NULL,
    hls_master_manifest_url TEXT NOT NULL,
    lossless_flac_url TEXT,
    stems_zip_url TEXT,
    isrc_code VARCHAR(50), -- DDEX: Master Recording Identifier
    iswc_code VARCHAR(50), -- DDEX: Composition/Publishing Identifier
    audio_fingerprint_id VARCHAR(255),
    play_count BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DDEX "Track" (Junction linking a SoundRecording to a Release at a specific position)
CREATE TABLE IF NOT EXISTS release_tracks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    release_id UUID NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    sound_recording_id UUID NOT NULL REFERENCES sound_recordings(id) ON DELETE CASCADE,
    track_number INT NOT NULL DEFAULT 1,
    disc_number INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(release_id, track_number, disc_number)
);

-- DDEX Multi-Party Contributions (Primary, Feature, Producer)
CREATE TABLE IF NOT EXISTS sound_recording_contributors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sound_recording_id UUID NOT NULL REFERENCES sound_recordings(id) ON DELETE CASCADE,
    creator_entity_id UUID NOT NULL REFERENCES creator_entities(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('primary_artist', 'featured_artist', 'producer', 'remixer', 'songwriter')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sound_recording_id, creator_entity_id, role)
);

-- 6. COMMUNITY HUBS & POSTS
CREATE TABLE IF NOT EXISTS community_posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    hub_entity_id UUID NOT NULL REFERENCES creator_entities(id) ON DELETE CASCADE,
    author_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_type VARCHAR(20) NOT NULL CHECK (post_type IN ('creator_broadcast', 'fan_post', 'exclusive_drop', 'event_announcement', 'curator_review')),
    visibility VARCHAR(20) NOT NULL CHECK (visibility IN ('public', 'subscribers_only', 'street_team')),
    content TEXT NOT NULL,
    media_urls TEXT[] DEFAULT '{}',
    is_pinned BOOLEAN DEFAULT FALSE,
    is_approved BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SUBSCRIPTION TIERS & STORE PRODUCTS
CREATE TABLE IF NOT EXISTS subscription_tiers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    creator_entity_id UUID NOT NULL REFERENCES creator_entities(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    tier_type VARCHAR(30) NOT NULL DEFAULT 'backstage' CHECK (tier_type IN ('backstage', 'vinyl_club', 'curator_patron', 'street_team_vip')),
    price_monthly_cents INT NOT NULL,
    description TEXT,
    perks JSONB NOT NULL DEFAULT '[]',
    stripe_price_id VARCHAR(100) UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_entity_id UUID NOT NULL REFERENCES creator_entities(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    product_type VARCHAR(30) NOT NULL CHECK (product_type IN ('vinyl', 'cd', 'cassette', 'apparel', 'ticket', 'digital_download', 'box_set')),
    price_cents INT NOT NULL,
    inventory_count INT DEFAULT 0,
    variants JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ALPHA INVITATION CODES
CREATE TABLE IF NOT EXISTS invitation_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    claimed_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    max_uses INT NOT NULL DEFAULT 1,
    current_uses INT NOT NULL DEFAULT 0,
    assigned_user_type VARCHAR(20) DEFAULT 'fan',
    target_email VARCHAR(255),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invitation_codes_code ON invitation_codes (code);

-- 9. MARKETING WAITLIST
CREATE TABLE IF NOT EXISTS waitlist_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    city_name VARCHAR(100),
    h3_index_res8 VARCHAR(15),
    user_type VARCHAR(50) DEFAULT 'fan' CHECK (user_type IN ('fan', 'artist', 'label', 'curator', 'venue')),
    source VARCHAR(50) DEFAULT 'marketing_landing',
    is_invited BOOLEAN DEFAULT FALSE,
    invitation_code_id UUID REFERENCES invitation_codes(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
