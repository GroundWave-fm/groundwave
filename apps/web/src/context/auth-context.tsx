'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { User, CreatorEntity, EntityMemberRole } from '@groundwave/types';

export interface ManagedEntitySummary {
  id: string;
  slug: string;
  name: string;
  entityType: string;
  avatarUrl?: string;
  role: EntityMemberRole;
  memberTitle?: string;
  royaltySplitPct: number;
  verificationStatus: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  managedEntities: ManagedEntitySummary[];
  activeEntity: ManagedEntitySummary | null;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'register';
  currentCity: string;
  currentH3Index: string;
  sceneRadiusMiles: number;
  onboardingCompleted: boolean;
  openAuthModal: (tab?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (email: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: {
    email: string;
    username: string;
    displayName: string;
    cityName?: string;
    inviteCode?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchActiveEntity: (entityId: string | null) => void;
  setSceneLocation: (cityName: string, h3Index: string, radiusMiles?: number, isCompleted?: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'groundwave_auth_token';
const USER_KEY = 'groundwave_auth_user';
const ENTITIES_KEY = 'groundwave_auth_entities';
const ACTIVE_ENTITY_KEY = 'groundwave_active_entity_id';
const SCENE_LOCATION_KEY = 'groundwave_scene_location';

const DEFAULT_CITY = 'Chicago';
const DEFAULT_H3 = '882681a339fffff'; // Chicago loop H3 Res 8

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [managedEntities, setManagedEntities] = useState<ManagedEntitySummary[]>([]);
  const [activeEntityId, setActiveEntityId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register'>('login');
  const router = useRouter();

  const [currentCity, setCurrentCity] = useState<string>(DEFAULT_CITY);
  const [currentH3Index, setCurrentH3Index] = useState<string>(DEFAULT_H3);
  const [sceneRadiusMiles, setSceneRadiusMiles] = useState<number>(15);
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean>(false);

  // Initialize state from local storage on mount
  useEffect(() => {
    try {
      const savedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);
      const savedEntities = localStorage.getItem(ENTITIES_KEY);
      const savedActiveEntityId = localStorage.getItem(ACTIVE_ENTITY_KEY);
      const savedSceneLoc = localStorage.getItem(SCENE_LOCATION_KEY);

      if (savedToken) setToken(savedToken);
      if (savedUser) setUser(JSON.parse(savedUser));
      if (savedEntities) setManagedEntities(JSON.parse(savedEntities));
      if (savedActiveEntityId) setActiveEntityId(savedActiveEntityId);
      if (savedSceneLoc) {
        const parsed = JSON.parse(savedSceneLoc);
        if (parsed.cityName) setCurrentCity(parsed.cityName);
        if (parsed.h3Index) setCurrentH3Index(parsed.h3Index);
        if (parsed.radiusMiles) setSceneRadiusMiles(parsed.radiusMiles);
        if (parsed.onboardingCompleted) setOnboardingCompleted(parsed.onboardingCompleted);
      }
    } catch (e) {
      console.error('Failed to load auth state from storage:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openAuthModal = useCallback((tab: 'login' | 'register' = 'login') => {
    setAuthModalTab(tab);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const setSceneLocation = useCallback((cityName: string, h3Index: string, radiusMiles = 15, isCompleted = false) => {
    setCurrentCity(cityName);
    setCurrentH3Index(h3Index);
    setSceneRadiusMiles(radiusMiles);
    setOnboardingCompleted(isCompleted);
    try {
      localStorage.setItem(
        SCENE_LOCATION_KEY,
        JSON.stringify({ cityName, h3Index, radiusMiles, onboardingCompleted: isCompleted })
      );
    } catch (e) {
      console.error('Failed to persist scene location:', e);
    }
  }, []);

  const fetchProfileAndEntities = useCallback(async (authToken: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
          localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          if (data.user.cityName && data.user.h3IndexRes8) {
            setSceneLocation(data.user.cityName, data.user.h3IndexRes8, data.user.sceneRadiusMiles, data.user.onboardingCompleted);
          } else {
            setOnboardingCompleted(data.user.onboardingCompleted || false);
          }
        }
        if (data.managedEntities) {
          setManagedEntities(data.managedEntities);
          localStorage.setItem(ENTITIES_KEY, JSON.stringify(data.managedEntities));
        }
      }
    } catch (err) {
      console.warn('Could not fetch remote profile:', err);
    }
  }, [setSceneLocation]);

  const login = useCallback(async (email: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }

      setToken(data.token);
      localStorage.setItem(TOKEN_KEY, data.token);
      if (data.user) {
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }

      await fetchProfileAndEntities(data.token);
      setIsAuthModalOpen(false);
      if (data.user && !data.user.onboardingCompleted) {
        router.push('/onboarding');
      } else {
        router.push('/feed');
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during login' };
    }
  }, [fetchProfileAndEntities, router]);

  const register = useCallback(async (formData: {
    email: string;
    username: string;
    displayName: string;
    cityName?: string;
    inviteCode?: string;
  }) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const res = await fetch(`${apiUrl}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      setToken(data.token);
      localStorage.setItem(TOKEN_KEY, data.token);
      if (data.user) {
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      }

      await fetchProfileAndEntities(data.token);
      setIsAuthModalOpen(false);
      if (data.user && !data.user.onboardingCompleted) {
        router.push('/onboarding');
      } else {
        router.push('/feed');
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Network error during registration' };
    }
  }, [fetchProfileAndEntities, router]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setManagedEntities([]);
    setActiveEntityId(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(ENTITIES_KEY);
      localStorage.removeItem(ACTIVE_ENTITY_KEY);
    } catch (e) {
      console.error('Failed to clear storage:', e);
    }
  }, []);

  const switchActiveEntity = useCallback((entityId: string | null) => {
    setActiveEntityId(entityId);
    try {
      if (entityId) {
        localStorage.setItem(ACTIVE_ENTITY_KEY, entityId);
      } else {
        localStorage.removeItem(ACTIVE_ENTITY_KEY);
      }
    } catch (e) {
      console.error('Failed to persist active entity:', e);
    }
  }, []);

  const activeEntity = useMemo(() => {
    if (!activeEntityId) return null;
    return managedEntities.find((e) => e.id === activeEntityId) || null;
  }, [activeEntityId, managedEntities]);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!token && !!user,
      isLoading,
      managedEntities,
      activeEntity,
      isAuthModalOpen,
      authModalTab,
      currentCity,
      currentH3Index,
      sceneRadiusMiles,
      onboardingCompleted,
      openAuthModal,
      closeAuthModal,
      login,
      register,
      logout,
      switchActiveEntity,
      setSceneLocation,
    }),
    [
      user,
      token,
      isLoading,
      managedEntities,
      activeEntity,
      isAuthModalOpen,
      authModalTab,
      currentCity,
      currentH3Index,
      sceneRadiusMiles,
      onboardingCompleted,
      openAuthModal,
      closeAuthModal,
      login,
      register,
      logout,
      switchActiveEntity,
      setSceneLocation,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
