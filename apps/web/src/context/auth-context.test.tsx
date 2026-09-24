import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthProvider, useAuth } from './auth-context';

describe('AuthContext & useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  it('provides default guest state on initial mount', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.activeEntity).toBeNull();
    expect(result.current.currentCity).toBe('Chicago');
    expect(result.current.isAuthModalOpen).toBe(false);
  });

  it('restores state from localStorage on mount', () => {
    localStorage.setItem('groundwave_auth_token', 'mock-token-123');
    localStorage.setItem(
      'groundwave_auth_user',
      JSON.stringify({ id: 'u1', username: 'testuser', displayName: 'Test User', email: 'test@example.com' })
    );
    localStorage.setItem(
      'groundwave_auth_entities',
      JSON.stringify([{ id: 'e1', name: 'Test Band', slug: 'testband', role: 'owner', royaltySplitPct: 100 }])
    );
    localStorage.setItem('groundwave_active_entity_id', 'e1');
    localStorage.setItem(
      'groundwave_scene_location',
      JSON.stringify({ cityName: 'Detroit', h3Index: '8826856235fffff', radiusMiles: 50 })
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.token).toBe('mock-token-123');
    expect(result.current.user?.username).toBe('testuser');
    expect(result.current.activeEntity?.name).toBe('Test Band');
    expect(result.current.currentCity).toBe('Detroit');
    expect(result.current.sceneRadiusMiles).toBe(50);
  });

  it('handles successful login and profile fetching', async () => {
    const mockUser = { id: 'u2', email: 'artist@groundwave.fm', username: 'elena', displayName: 'Elena Vance' };
    const mockEntities = [
      { id: 'e2', slug: 'static_veins', name: 'The Static Veins', role: 'owner', royaltySplitPct: 50, verificationStatus: 'verified' }
    ];

    const fetchSpy = vi.spyOn(global, 'fetch').mockImplementation((url) => {
      const urlStr = url.toString();
      if (urlStr.includes('/api/v1/auth/login')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: 'jwt-elena', user: mockUser }),
        } as Response);
      }
      if (urlStr.includes('/api/v1/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: mockUser, managedEntities: mockEntities }),
        } as Response);
      }
      return Promise.reject(new Error('Unknown url'));
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginRes: any;
    await act(async () => {
      loginRes = await result.current.login('artist@groundwave.fm');
    });

    expect(loginRes.success).toBe(true);
    expect(result.current.token).toBe('jwt-elena');
    expect(result.current.user?.username).toBe('elena');
    expect(result.current.managedEntities.length).toBe(1);
    expect(result.current.isAuthenticated).toBe(true);

    fetchSpy.mockRestore();
  });

  it('handles failed login response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'User not found' }),
    } as Response);

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginRes: any;
    await act(async () => {
      loginRes = await result.current.login('unknown@user.com');
    });

    expect(loginRes.success).toBe(false);
    expect(loginRes.error).toBe('User not found');
  });

  it('handles login network exception', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network down'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    let loginRes: any;
    await act(async () => {
      loginRes = await result.current.login('test@user.com');
    });

    expect(loginRes.success).toBe(false);
    expect(loginRes.error).toBe('Network down');
  });

  it('handles successful registration', async () => {
    const mockNewUser = {
      id: 'u3',
      email: 'new@fan.com',
      username: 'newfan',
      displayName: 'New Fan',
      cityName: 'Austin',
      h3IndexRes8: '88262a5b11fffff',
    };

    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      const urlStr = url.toString();
      if (urlStr.includes('/api/v1/auth/register')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: 'jwt-newfan', user: mockNewUser }),
        } as Response);
      }
      if (urlStr.includes('/api/v1/auth/me')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user: mockNewUser, managedEntities: [] }),
        } as Response);
      }
      return Promise.reject(new Error('Unknown url'));
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    let regRes: any;
    await act(async () => {
      regRes = await result.current.register({
        email: 'new@fan.com',
        username: 'newfan',
        displayName: 'New Fan',
        cityName: 'Austin',
      });
    });

    expect(regRes.success).toBe(true);
    expect(result.current.user?.username).toBe('newfan');
    expect(result.current.currentCity).toBe('Austin');
  });

  it('handles registration failure', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Username already taken' }),
    } as Response);

    const { result } = renderHook(() => useAuth(), { wrapper });

    let regRes: any;
    await act(async () => {
      regRes = await result.current.register({
        email: 'taken@fan.com',
        username: 'taken',
        displayName: 'Taken User',
      });
    });

    expect(regRes.success).toBe(false);
    expect(regRes.error).toBe('Username already taken');
  });

  it('logs out and clears storage', () => {
    localStorage.setItem('groundwave_auth_token', 'mock-token');
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('groundwave_auth_token')).toBeNull();
  });

  it('opens and closes auth modal with specific tab', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.openAuthModal('register');
    });
    expect(result.current.isAuthModalOpen).toBe(true);
    expect(result.current.authModalTab).toBe('register');

    act(() => {
      result.current.closeAuthModal();
    });
    expect(result.current.isAuthModalOpen).toBe(false);
  });

  it('updates scene location and persists to local storage', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.setSceneLocation('Austin', '88262a5b11fffff', 25);
    });

    expect(result.current.currentCity).toBe('Austin');
    expect(result.current.currentH3Index).toBe('88262a5b11fffff');
    expect(result.current.sceneRadiusMiles).toBe(25);

    const saved = JSON.parse(localStorage.getItem('groundwave_scene_location') || '{}');
    expect(saved.cityName).toBe('Austin');
  });

  it('switches active entity context correctly', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    act(() => {
      result.current.switchActiveEntity('entity-123');
    });

    expect(localStorage.getItem('groundwave_active_entity_id')).toBe('entity-123');

    act(() => {
      result.current.switchActiveEntity(null);
    });

    expect(localStorage.getItem('groundwave_active_entity_id')).toBeNull();
  });

  it('throws error when useAuth is called outside AuthProvider', () => {
    expect(() => renderHook(() => useAuth())).toThrow(
      'useAuth must be used within an AuthProvider'
    );
  });
});
