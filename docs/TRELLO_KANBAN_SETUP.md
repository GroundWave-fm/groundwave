# GroundWave Phase 1 — Trello Kanban Board

> 🔗 **Live Trello Board**: [**https://trello.com/b/30tJWIxY/groundwave-phase-1-alpha**](https://trello.com/b/30tJWIxY/groundwave-phase-1-alpha)

This board is pre-configured with all 6 Kanban lists, color-coded epic labels, and initial sprint cards with acceptance criteria checklists.

---

## 1. Board Structure & Columns (Lists)

Set up your Trello board with the following 6 standard Kanban columns:

```
[ 📋 Backlog ] ➔ [ 🎯 Sprint Active (Next Up) ] ➔ [ 🚧 In Progress ] ➔ [ 👀 In Review / PR ] ➔ [ 🧪 QA & Testing ] ➔ [ ✅ Done (Alpha Gate) ]
```

---

## 2. Color-Coded Labels

| Label Name | Color | Description |
| :--- | :--- | :--- |
| `Epic 1: Auth & Geo` | Blue | User auth, RBAC roles, H3 spatial grid indexing |
| `Epic 2: Media Ingestion` | Purple | WAV/FLAC upload, FFmpeg HLS transcoding, ACRCloud fingerprinting |
| `Epic 3: Playback Engine` | Green | Persistent global audio dock, lock-screen controls, adaptive streaming |
| `Epic 4: Creator Hubs` | Orange | Artist/Label sanctums, anti-spam posting isolation, mod tools |
| `Epic 5: Stripe & Splits` | Yellow | Stripe Connect, subscriptions, merch store, multi-party payout ledger |
| `Epic 6: Scene Radio` | Sky Blue | `pgvector` hybrid recommendation engine, Spotify library import |
| `P0 - Blocker` | Red | Critical path / blocker tasks |
| `P1 - High` | Pink | High priority core deliverables |

---

## 3. Ready-to-Use Task Cards (Copy & Paste into Trello)

---

### Column: `[ 🎯 Sprint Active (Next Up) ]` (Foundation Sprint)

#### Card 1: `[GW-101] PostgreSQL Database & PostGIS/H3 Spatial Schema Setup`
* **Labels**: `Epic 1: Auth & Geo`, `Backend`, `P0 - Blocker`
* **Description**:
  Initialize PostgreSQL 16 database with PostGIS and pgvector extensions. Implement initial DDL migrations for users, profiles, and spatial indices.
* **Checklist**:
  - [ ] Configure Docker Compose with PostgreSQL 16 + PostGIS + pgvector
  - [ ] Create `users` table with RBAC roles (`listener`, `artist`, `label`, `curator`, `venue`, `admin`)
  - [ ] Implement `artist_profiles` and `label_profiles` schemas
  - [ ] Add H3 spatial grid resolution 8 index column for location hashing
  - [ ] Write DB seed script for testing

#### Card 2: `[GW-102] Auth & RBAC Microservice (OAuth + Magic Link)`
* **Labels**: `Epic 1: Auth & Geo`, `Backend`, `P0 - Blocker`
* **Description**:
  Implement user authentication using JWT and OAuth2 (Google & Apple Sign-In), supporting multi-role onboarding and profile initialization.
* **Checklist**:
  - [ ] Setup OAuth2 / JWT token generation and validation middleware
  - [ ] Implement Google & Apple OAuth sign-in endpoints
  - [ ] Implement Passwordless Magic Link email authentication
  - [ ] Create `/api/v1/auth/me` and `/api/v1/users/profile` endpoints
  - [ ] Add role-based route protection middleware

#### Card 3: `[GW-201] Presigned Direct-to-Storage Master Audio Ingestion`
* **Labels**: `Epic 2: Media Ingestion`, `Backend`, `P0 - Blocker`
* **Description**:
  Create an endpoint that issues secure presigned upload URLs (S3/GCS/R2) for large master audio files (WAV, FLAC, AIFF up to 2GB) and cover artwork.
* **Checklist**:
  - [ ] Configure S3 / Google Cloud Storage bucket with CORS for chunked uploads
  - [ ] Implement `/api/v1/media/upload-url` presigned URL generator
  - [ ] Add client-side resumable upload handler (Uppy / TUS)
  - [ ] Implement storage webhook / event listener for upload completion

#### Card 4: `[GW-202] FFmpeg Asynchronous Transcoding Pipeline (HLS & Lossless)`
* **Labels**: `Epic 2: Media Ingestion`, `Backend`, `DevOps`, `P1 - High`
* **Description**:
  Build worker service to transcode master audio files into adaptive multi-bitrate HLS streams (`.m3u8`) and extract 100-point JSON waveforms.
* **Checklist**:
  - [ ] Setup background worker queue (Temporal / BullMQ / Celery)
  - [ ] Transcode to AAC 128 kbps (low data)
  - [ ] Transcode to AAC 320 kbps (standard stream)
  - [ ] Package 24-bit/48kHz Lossless stream (ALAC / FLAC)
  - [ ] Extract normalized 100-point waveform array for UI scrubbers
  - [ ] Upload transcoded assets to public CDN distribution bucket

---

### Column: `[ 📋 Backlog ]` (Sprint 5–16 Tasks)

#### Card 5: `[GW-301] Persistent Global Audio Dock (Web / Mobile Client)`
* **Labels**: `Epic 3: Playback Engine`, `Frontend`, `P0 - Blocker`
* **Description**:
  Implement the persistent global bottom audio dock that maintains continuous, uninterrupted playback across all route changes and page navigations.
* **Checklist**:
  - [ ] Implement global audio state machine (Zustand / Redux)
  - [ ] Support HLS adaptive bitrate streaming with Hls.js
  - [ ] Build interactive waveform scrubber and timestamp display
  - [ ] Implement background audio queue (Next, Prev, Shuffle, Repeat)
  - [ ] Integrate iOS `MPNowPlayingInfoCenter` & Android `MediaSession`

#### Card 6: `[GW-401] Artist & Label Community Hub Post Engine`
* **Labels**: `Epic 4: Creator Hubs`, `Backend`, `Frontend`, `P1 - High`
* **Description**:
  Build the dedicated creator hubs where fans can interact *only* inside followed artist/label spaces with granular moderation.
* **Checklist**:
  - [ ] Implement `community_posts` API with tier visibility (`public`, `subscribers_only`, `street_team`)
  - [ ] Implement anti-noise guardrail (prevent fan posting to global feed; restrict to Hubs)
  - [ ] Add media attachments support (photos, studio video snippets)
  - [ ] Build Street Team Captain assignment and moderation actions (mute, ban, pin)

#### Card 7: `[GW-501] Stripe Connect Custom/Express Onboarding & Payouts`
* **Labels**: `Epic 5: Stripe & Splits`, `Backend`, `P0 - Blocker`
* **Description**:
  Integrate Stripe Connect so independent artists and labels can link their bank accounts to receive direct payouts and multi-party splits.
* **Checklist**:
  - [ ] Implement Stripe Connect Account creation endpoint (`/api/v1/payouts/connect`)
  - [ ] Generate Stripe Express onboarding dashboard link
  - [ ] Handle Stripe webhooks (`account.updated`, `capability.transfers`)
  - [ ] Store Stripe Account ID and payout eligibility status in DB

#### Card 8: `[GW-502] Tiered Subscriptions & Digital/Physical Storefront`
* **Labels**: `Epic 5: Stripe & Splits`, `Backend`, `Frontend`, `P1 - High`
* **Description**:
  Allow creators to configure monthly subscription tiers ("Backstage Pass", "Vinyl Club") and sell physical/digital merch items.
* **Checklist**:
  - [ ] Build subscription tier configuration UI & Stripe Billing integration
  - [ ] Create `products` table for physical vinyl, apparel, and digital downloads
  - [ ] Implement in-app checkout with Apple Pay / Google Pay / Cards
  - [ ] Build automated programmatic split calculation at checkout (e.g. 92% to creator, 8% platform)

#### Card 9: `[GW-601] Scene Radio Hybrid Recommendation Engine (pgvector + PostGIS)`
* **Labels**: `Epic 6: Scene Radio`, `Backend`, `P1 - High`
* **Description**:
  Build the seed-based Scene Radio recommendation engine combining spatial geographic filtering with acoustic vector similarity.
* **Checklist**:
  - [ ] Generate 128-dimensional acoustic embeddings for uploaded tracks
  - [ ] Implement hybrid candidate generation query (`pgvector` cosine similarity + PostGIS `ST_DWithin`)
  - [ ] Build infinite queue generation API endpoint (`/api/v1/radio/station`)
  - [ ] Cache radio streams in Redis for instantaneous track pre-buffering

#### Card 10: `[GW-602] (Phase 2 Post-MVP) Spotify & Apple Music Library Import Bridge`
* **Labels**: `Epic 6: Scene Radio`, `Phase 2`, `Deferred`
* **Description**:
  *(Deferred to Phase 2 Post-MVP)*: Once substantial catalog density is reached, allow Spotify listeners to import their saved library and map external ISRCs to GroundWave local scenes.

---

## 4. How to Set Up in Trello:
1. Create a new Trello board named **"GroundWave — Phase 1 Alpha"**.
2. Create the 6 lists: `📋 Backlog`, `🎯 Sprint Active`, `🚧 In Progress`, `👀 In Review`, `🧪 QA & Testing`, `✅ Done`.
3. Create the 8 color labels listed in Section 2.
4. Copy and paste the 10 pre-formatted cards into your board!
