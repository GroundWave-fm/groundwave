/**
 * Groundwave (groundwave.fm) Domain Models & Type Definitions
 */

// ==========================================
// 1. Users & Roles
// ==========================================

export type UserRole = 'listener' | 'artist' | 'label' | 'curator' | 'venue' | 'admin';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  displayName: string;
  bio?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  cityName?: string;
  countryCode?: string;
  h3IndexRes8?: string; // Obfuscated location (~1km resolution)
  createdAt: string;
  updatedAt: string;
}

export interface ArtistProfile {
  artistId: string;
  stripeAccountId?: string;
  payoutsEnabled: boolean;
  spotifyUrl?: string;
  bandcampUrl?: string;
  instagramHandle?: string;
  communityGuidelines?: string;
  allowFanPosts: boolean;
  requireModApproval: boolean;
  createdAt: string;
}

export interface LabelProfile {
  labelId: string;
  stripeAccountId?: string;
  foundedYear?: number;
  headquartersCity?: string;
  distributorInfo?: string;
  hasVinylClub: boolean;
  createdAt: string;
}

export interface CuratorProfile {
  curatorId: string;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'suspended';
  reputationScore: number;
  curatorType: 'tastemaker' | 'dj' | 'journalist' | 'college_radio' | 'collective';
  showName?: string;
  stripeAccountId?: string;
  approvedAt?: string;
  createdAt: string;
}

// ==========================================
// 2. Music, Releases & Streaming
// ==========================================

export type ReleaseType = 'single' | 'ep' | 'album' | 'label_compilation' | 'stem_pack' | 'live_bootleg';

export interface Release {
  id: string;
  primaryArtistId: string;
  labelId?: string;
  title: string;
  releaseType: ReleaseType;
  coverArtUrl: string;
  releaseDate: string;
  isExclusiveToTier?: string;
  createdAt: string;
}

export interface Track {
  id: string;
  releaseId: string;
  artistId: string;
  title: string;
  trackNumber: number;
  durationSeconds: number;
  hlsMasterManifestUrl: string;
  losslessFlacUrl?: string;
  stemsZipUrl?: string;
  isrcCode?: string;
  audioFingerprintId?: string;
  playCount: number;
  waveform?: number[];
  createdAt: string;
}

// ==========================================
// 3. Community Hubs & Posts
// ==========================================

export type PostType = 'creator_broadcast' | 'fan_post' | 'exclusive_drop' | 'event_announcement' | 'curator_review';
export type PostVisibility = 'public' | 'subscribers_only' | 'street_team';

export interface CommunityPost {
  id: string;
  hubId: string; // Target Artist or Label Hub ID
  authorId: string;
  postType: PostType;
  visibility: PostVisibility;
  content: string;
  mediaUrls: string[];
  isPinned: boolean;
  isApproved: boolean;
  likeCount: number;
  commentCount: number;
  createdAt: string;
}

// ==========================================
// 4. Commerce & Monetization
// ==========================================

export type ProductType = 'vinyl' | 'cd' | 'cassette' | 'apparel' | 'ticket' | 'digital_download' | 'box_set';

export interface Product {
  id: string;
  sellerId: string;
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
  creatorId: string;
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
// 5. Audio Player & Scene Radio State
// ==========================================

export type PlaybackQuality = 'auto_hls' | '128k' | '320k' | 'lossless_flac';

export interface PlaybackState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  quality: PlaybackQuality;
  queue: Track[];
  queueIndex: number;
  radioMode: boolean;
  seedArtistId?: string;
}
