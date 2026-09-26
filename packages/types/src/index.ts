/**
 * GroundWave (groundwave.fm) Domain Models & Type Definitions
 */

// ==========================================
// 1. Users (Personal Human Identity & Auth)
// ==========================================

export interface User {
  id: string;
  email: string;
  username: string; // @personal_handle
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  cityName?: string;
  countryCode?: string;
  sceneRadiusMiles?: number;
  onboardingCompleted?: boolean;
  h3IndexRes8?: string; // Obfuscated location (~1km resolution)
  isPlatformAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 2. Creator Collectives & Entities (Bands, Solo Artists, Labels, Curators, Venues)
// ==========================================

export type EntityType = 'solo_artist' | 'band' | 'label' | 'curator' | 'venue';
export type VerificationStatus = 'unverified' | 'pending' | 'verified' | 'suspended';

export interface CreatorEntity {
  id: string;
  slug: string; // @public_handle (e.g. @static_veins, @midwest_pressings)
  name: string;
  entityType: EntityType;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  cityName?: string;
  countryCode?: string;
  sceneRadiusMiles?: number;
  onboardingCompleted?: boolean;
  h3IndexRes8?: string;
  stripeAccountId?: string;
  payoutsEnabled: boolean;
  communityGuidelines?: string;
  allowFanPosts: boolean;
  requireModApproval: boolean;
  verificationStatus: VerificationStatus;
  createdAt: string;
  updatedAt: string;
}

// ==========================================
// 3. Multi-User Team Memberships & Permissions
// ==========================================

export type EntityMemberRole = 'owner' | 'admin' | 'member' | 'moderator' | 'finance_manager';

export interface EntityMembership {
  id: string;
  entityId: string;
  userId: string;
  role: EntityMemberRole;
  memberTitle?: string; // e.g. "Lead Guitar & Vocals", "Label Founder"
  royaltySplitPct: number; // e.g. 25.00 for band internal splits
  createdAt: string;
  user?: User;
  entity?: CreatorEntity;
}

// ==========================================
// 4. Music, Releases & Streaming
// ==========================================

export type ReleaseType = 'single' | 'ep' | 'album' | 'label_compilation' | 'stem_pack' | 'live_bootleg';

export interface Release {
  id: string;
  creatorEntityId: string; // Band or Artist Entity
  labelEntityId?: string; // Optional Record Label Entity
  title: string;
  releaseType: ReleaseType;
  coverArtUrl: string;
  releaseDate: string;
  upcEanCode?: string; // DDEX: Universal Product Code
  isExclusiveToTier?: string;
  createdAt: string;
}

export interface SoundRecording {
  id: string;
  title: string;
  artistName?: string;
  coverArtUrl?: string;
  durationSeconds: number;
  hlsMasterManifestUrl: string;
  losslessFlacUrl?: string;
  stemsZipUrl?: string;
  isrcCode?: string;
  iswcCode?: string; // DDEX: Composition Identifier
  audioFingerprintId?: string;
  playCount: number;
  waveform?: number[];
  createdAt: string;
}

export interface ReleaseTrack {
  id: string;
  releaseId: string;
  soundRecordingId: string;
  trackNumber: number;
  discNumber?: number;
  createdAt: string;
}

export interface SoundRecordingContributor {
  id: string;
  soundRecordingId: string;
  creatorEntityId: string;
  role: 'primary_artist' | 'featured_artist' | 'producer' | 'remixer' | 'songwriter';
  createdAt: string;
}

// ==========================================
// 5. Community Hubs & Posts
// ==========================================

export type PostType = 'creator_broadcast' | 'fan_post' | 'exclusive_drop' | 'event_announcement' | 'curator_review';
export type PostVisibility = 'public' | 'subscribers_only' | 'street_team';

export interface CommunityPost {
  id: string;
  hubEntityId: string; // Target Creator Entity Hub ID
  authorUserId: string; // Individual Human Author ID
  postType: PostType;
  visibility: PostVisibility;
  content: string;
  mediaUrls: string[];
  isPinned: boolean;
  isApproved: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  author?: User;
}

// ==========================================
// 6. Commerce & Monetization
// ==========================================

export type ProductType = 'vinyl' | 'cd' | 'cassette' | 'apparel' | 'ticket' | 'digital_download' | 'box_set';

export interface Product {
  id: string;
  sellerEntityId: string;
  title: string;
  productType: ProductType;
  priceCents: number;
  inventoryCount: number;
  variants: Array<{
    id: string;
    name: string;
    sku: string;
    additionalCents?: number;
    inventory: number;
  }>;
  isActive: boolean;
  createdAt: string;
}

export interface SubscriptionTier {
  id: string;
  creatorEntityId: string;
  name: string;
  tierType: 'backstage' | 'vinyl_club' | 'curator_patron' | 'street_team_vip';
  priceMonthlyCents: number;
  description?: string;
  perks: string[];
  stripePriceId?: string;
  isActive: boolean;
  createdAt: string;
}

// ==========================================
// 7. Audio Player & Scene Radio State
// ==========================================

export type PlaybackQuality = 'auto_hls' | '128k' | '320k' | 'lossless_flac';

export interface PlaybackState {
  currentTrack: SoundRecording | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  quality: PlaybackQuality;
  queue: SoundRecording[];
  queueIndex: number;
  radioMode: boolean;
  seedEntityId?: string;
}

// ==========================================
// 8. Marketing Waitlist
// ==========================================

export type WaitlistUserType = 'fan' | 'artist' | 'label' | 'curator' | 'venue';

export interface WaitlistEntry {
  id: string;
  email: string;
  cityName?: string;
  h3IndexRes8?: string;
  userType: WaitlistUserType;
  source: string;
  createdAt: string;
}

export interface CreateWaitlistInput {
  email: string;
  cityName?: string;
  userType?: WaitlistUserType;
  source?: string;
}

export interface WaitlistResponse {
  success: boolean;
  message: string;
  alreadyRegistered?: boolean;
  entry?: WaitlistEntry;
}


// ==========================================
// 9. Media & Uploads
// ==========================================

export interface UploadUrlRequestBody {
  filename: string;
  contentType: string;
  fileSize: number;
}
