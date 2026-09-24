# Product Requirements Document (PRD)
## Project: GroundWave (`groundwave.fm`) — Local-First Music & Creator Economy Platform

---

## 1. Product Overview & Goals

**GroundWave (`groundwave.fm`)** is a local-first social music platform that unifies lossless music streaming, localized Scene Radios, video/audio social discovery, native artist and indie label storefronts, verified curator broadcasting, and tiered memberships into a single cohesive experience.

### Core Objectives:
1. **Effortless Lean-Back Discovery**: Provide converting Spotify listeners with infinite, high-quality **Scene Radios** seeded by their favorite local bands without algorithmic corporate dilution.
2. **Empower Artists & Labels Economically**: Deliver a direct monetization stack where 85–95% of revenues flow straight to creators and independent labels.
3. **Elevate Tastemakers & Curators**: Reward community curators for discovering and showcasing talent with native monetization and automated royalty attribution to the featured artists.
4. **Eliminate Community Fragmentation**: Offer artist- and label-governed hubs with strict anti-spam controls that eliminate the need to juggle external Discord/Reddit/Patreon links.
5. **Zero-Friction Conversion**: Convert casual background listeners seamlessly into ticket-buyers, patrons, and merch collectors via interactive in-player prompts.

---

## 2. User Personas & Permissions Matrix

| Persona | Description | Key Capabilities & Rights |
| :--- | :--- | :--- |
| **Casual Listener / Commuter** ⭐ *(New)* | Passive, lean-back listener converting from Spotify seeking effortless background music rooted in their local scene. | - 1-tap **Scene Radio** playback seeded by favorite local artists or city.<br>- Spotify playlist & favorites import.<br>- CarPlay / Android Auto / Bluetooth integration.<br>- Contextual lock-screen notifications for nearby shows & releases. |
| **Enthusiast / Superfan** | Active music collector seeking rare vinyl, live shows, and direct artist interaction. | - Stream audio/video lossless.<br>- Post/comment *exclusively* within followed Artist/Label Hubs.<br>- Purchase physical/digital items & subscribe in 2 taps.<br>- Check in at live venues for digital perks. |
| **Artist / Musician** | Independent musician, band, or producer managing their catalog and audience. | - Upload lossless audio, visualizers, stems, and clips.<br>- Manage multi-tier subscriptions & custom perks.<br>- Sell physical merch & concert tickets natively.<br>- Full community moderation authority (ban, mute, pin, grant badges).<br>- Automated royalty split management via Stripe Connect. |
| **Independent Label Owner** | Verified entity managing a roster of independent artists, imprints, or collectives. | - Create and manage verified **Label Hub**.<br>- Manage signed artist profiles and cross-roster release schedules.<br>- Sell label-exclusive physical runs (vinyl, cassettes, merch) & digital downloads.<br>- Offer label-wide subscriptions ("Record of the Month Club").<br>- Configure automated contractual royalty splits with roster artists. |
| **Verified Music Curator** | Qualified tastemakers, DJs, scene journalists, and podcast hosts. | - Create and publish original multimedia content (curated playlists, podcasts, video essays).<br>- Utilize music published on GroundWave with automated fingerprinting and track attribution.<br>- Earn revenue from curator show subscriptions, sponsorships, and tips (auto-split with featured artists). |
| **Venue / Record Store** | Independent live venues, record shops, and local cultural nodes. | - Manage official Venue Node & live concert calendar.<br>- Host digital venue check-ins & exclusive venue drops.<br>- Curate official local scene playlists on `groundwave.fm`. |
| **Platform Admin** | Platform operations, trust & safety, financial compliance. | - Curator verification approvals.<br>- DMCA & copyright resolution portal.<br>- Fraud detection & KYC review (Stripe Connect). |

---

## 3. Functional Requirements by Module

### 3.1 Module 1: Scene Radios & Algorithmic Recommendation Engine
* **FR-1.1**: **Artist Seed Radio**: When a user selects "Start Artist Radio" on any artist, the engine must generate an infinite queue balancing:
  * 40% acoustically similar tracks from artists within the same metropolitan area / region.
  * 30% tracks frequently co-curated by verified local tastemakers or played on regional tour bills.
  * 30% relevant regional/global peer artists.
* **FR-1.2**: **City Scene Stations**: Provide 1-tap pre-compiled algorithmic stations for major metro areas (e.g., *Austin Indie Rock*, *Chicago Post-Punk & Emo*, *Bristol Bass & Electronic*).
* **FR-1.3**: **Spotify / Apple Music Importer**: Allow users to authenticate via OAuth to scan their library and map saved tracks to GroundWave artists and Scene Radios.
* **FR-1.4**: **Contextual Lean-Back UI**: Lock screen and audio player widgets must display geographic origin tags (e.g., *"Recorded in East Austin • Playing at Hotel Vegas on Oct 12"*).

### 3.2 Module 2: Geographic & Scene Discovery Engine
* **FR-2.1**: The app must provide an interactive Geo-Slider allowing users to toggle between:
  * *Neighborhood / Hyperlocal* (1–10 mile radius)
  * *City / Metro Area* (e.g., Chicago, Austin, London)
  * *Regional Corridor* (250 mile radius)
  * *Global / Remote Exploration* (Custom city hopping)
* **FR-2.2**: If a user's local radius contains insufficient new releases (< 10 tracks), the engine must gracefully expand to regional boundaries while appending distance tags.
* **FR-2.3**: Interactive **Scene Map** displaying live venue calendars, recording studios, indie label headquarters, and record shops.

### 3.3 Module 3: Integrated Streaming & Multimedia Feed
* **FR-3.1**: Persistent Audio Engine: Full audio playback persists uninterrupted across all screen transitions and background lock-screen usage.
* **FR-3.2**: Lossless Streaming: Adaptive HLS (128k to 320k) with Lossless 24-bit/48kHz FLAC toggle.
* **FR-3.3**: In-Feed Action Drawer: 1-tap actions: *[Buy Vinyl]*, *[Get Tickets]*, *[Join Backstage Club]*, *[Tip \$3]*.

### 3.4 Module 4: Independent Label Hubs & Curator Engine
* **FR-4.1**: Label Hubs: Multi-artist catalog management, label-wide storefronts, and "Vinyl of the Month" clubs.
* **FR-4.2**: Curator Multimedia: Publishing tools for podcasts, shows, and annotated playlists with automated audio fingerprinting and track timeline attribution.
* **FR-4.3**: Automated Split Ledger: Proportional distribution of show revenue between curators and featured artists/labels.

### 3.5 Module 5: Artist Hubs & Governed Communities
* **FR-5.1**: Fan Posting Isolation: Fans are **strictly disallowed** from posting to the global broadcast feed; posts are confined to target Artist/Label Hubs.
* **FR-5.2**: Moderation Suite: Street Team Captain assignments, pre-moderation queue, keyword filtering, and instant mute/ban actions.

---

## 4. Non-Functional & Quality Requirements

* **Car & Background Audio**: Background audio session compatibility with iOS NowPlayingInfo / Android MediaSession, supporting seamless CarPlay and Android Auto control.
* **Radio Queue Latency**: Initial station generation and track pre-fetching must take $< 150\text{ms}$.
* **Privacy**: Listener GPS coordinates hashed to broad H3 grid levels (approx 5km resolution); no precise geolocation tracking.
