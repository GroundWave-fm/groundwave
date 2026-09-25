# GroundWave Project Management & Issue Tracking (`PROJECT_MANAGEMENT.md`)

> **Single Source of Truth for Sprint Planning, Backlog & Deliverables**  
> GitHub Issues & GitHub Projects: [**https://github.com/GroundWave-fm/GroundWave/issues**](https://github.com/GroundWave-fm/GroundWave/issues)

---

## 1. Project Workflow & Kanban Columns

GroundWave uses **GitHub Projects** with automated status columns linked to pull request events:

```
[ 📋 Backlog ] ──► [ 🎯 Todo / Sprint Active ] ──► [ 🚧 In Progress ] ──► [ 👀 In Review (PR) ] ──► [ ✅ Done ]
```

* **📋 Backlog**: Unscheduled feature cards, deferred epics (e.g. Phase 2 Spotify Bridge).
* **🎯 Todo / Sprint Active**: Active Phase 1 tickets ready for development.
* **🚧 In Progress**: Actively worked on by a developer or agent on a dedicated `feat/GW-...` branch.
* **👀 In Review (PR)**: Open Pull Request passing GitHub Actions CI quality gates.
* **✅ Done**: PR squashed and merged into `main`; issue automatically closed.

---

## 2. Standard Label Taxonomy

| Label Name | Description & Usage | Color |
| :--- | :--- | :--- |
| `epic:auth-geo` | User authentication, RBAC permissions, Uber H3 spatial resolution | `#1d76db` |
| `epic:media-ingestion` | Direct-to-storage upload, FFmpeg HLS transcoding, waveforms | `#7057ff` |
| `epic:playback-engine` | Persistent global audio dock, waveform scrubbers, HLS streaming | `#0e8a16` |
| `epic:creator-hubs` | Artist/Label hubs, anti-spam posting isolation, moderation | `#fbca04` |
| `epic:stripe-splits` | Stripe Connect, tiered subscriptions, instant royalty splits | `#d93f0b` |
| `epic:scene-radio` | Hybrid recommendation engine (PostGIS + pgvector + Redis) | `#006b75` |
| `priority:p0` | Critical path / blocker for Phase 1 Alpha | `#b60205` |
| `priority:p1` | High-priority core deliverable | `#d93f0b` |

---

## 3. Phase 1 Alpha Issue Catalog

| Issue # | Title | Epic Label | Priority | Status |
| :--- | :--- | :--- | :--- | :--- |
| **#1** | `[GW-101]` PostgreSQL Database & PostGIS/H3 Spatial Schema Setup | `epic:auth-geo` | `priority:p0` | ✅ Closed |
| **#2** | `[GW-102]` Auth & RBAC Microservice (JWT + Creator Entity RBAC) | `epic:auth-geo` | `priority:p0` | ✅ Closed |
| **#3** | `[GW-201]` Presigned Direct-to-Storage Master Audio & Artwork Ingestion | `epic:media-ingestion` | `priority:p0` | 🎯 Next Up |
| **#4** | `[GW-202]` FFmpeg Asynchronous Transcoding Pipeline (HLS 128k/320k/Lossless) | `epic:media-ingestion` | `priority:p0` | 📋 Backlog |
| **#5** | `[GW-301]` Persistent Global Audio Engine & Player Dock | `epic:playback-engine` | `priority:p0` | 📋 Backlog |
| **#6** | `[GW-401]` Artist & Label Creator Studio & Release Publisher | `epic:creator-hubs` | `priority:p0` | 📋 Backlog |
| **#7** | `[GW-501]` Stripe Connect Custom Onboarding & Direct Fan Purchases | `epic:stripe-splits` | `priority:p0` | 📋 Backlog |
| **#8** | `[GW-502]` Tiered Subscriptions & Automated Instant Member Splits | `epic:stripe-splits` | `priority:p1` | 📋 Backlog |
| **#9** | `[GW-601]` Scene Radio Hybrid Queue Engine (PostGIS + Redis Weighted Shuffle) | `epic:scene-radio` | `priority:p0` | 📋 Backlog |
| **#10** | `[GW-602]` Spotify & Apple Music Library Import Bridge | `epic:scene-radio` | `priority:p1` | ⏸️ Deferred (Phase 2) |
