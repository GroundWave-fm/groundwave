import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminWaitlistModal } from './admin-waitlist-modal';
import * as AuthContextModule from '@/context/auth-context';

describe('AdminWaitlistModal Component', () => {
  const mockToken = 'mock-admin-token';
  const mockAdminUser = {
    id: 'user-admin',
    email: 'admin@groundwave.fm',
    username: 'admin',
    displayName: 'Platform Admin',
    isPlatformAdmin: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  const sampleEntries = [
    {
      id: 'wl-1',
      email: 'tester@chicago.fm',
      cityName: 'Chicago',
      userType: 'listener',
      source: 'web_marketing',
      isInvited: false,
      createdAt: '2026-09-20T10:00:00Z',
    },
    {
      id: 'wl-2',
      email: 'vip@label.com',
      cityName: 'Detroit',
      userType: 'artist',
      source: 'web_marketing',
      isInvited: true,
      inviteCode: 'GW-WL-ABC123',
      currentUses: 0,
      maxUses: 1,
      createdAt: '2026-09-21T12:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      token: mockToken,
      user: mockAdminUser,
    } as any);

    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      configurable: true,
      writable: true,
    });
  });

  it('does not render when isOpen is false', () => {
    render(<AdminWaitlistModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('fetches and displays waitlist entries with summary stats when opened', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ entries: sampleEntries }),
    } as Response);

    render(<AdminWaitlistModal isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Alpha Waitlist Console')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('tester@chicago.fm')).toBeInTheDocument();
      expect(screen.getByText('vip@label.com')).toBeInTheDocument();
    });

    // Check stats: Total 2, Promoted 1, Pending 1
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getAllByText('1')).toHaveLength(2);
  });

  it('filters waitlist entries by search query', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ entries: sampleEntries }),
    } as Response);

    render(<AdminWaitlistModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('tester@chicago.fm')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by email/i);
    fireEvent.change(searchInput, { target: { value: 'Detroit' } });

    expect(screen.queryByText('tester@chicago.fm')).not.toBeInTheDocument();
    expect(screen.getByText('vip@label.com')).toBeInTheDocument();
  });

  it('grants alpha invite to a pending subscriber and copies code', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((input: any) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/v1/waitlist/entries')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ entries: sampleEntries }),
        } as Response);
      }
      if (url.includes('/api/v1/auth/invite/grant-waitlist')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              inviteCode: 'GW-WL-TEST99',
              message: 'Alpha invite code created',
            }),
        } as Response);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response);
    });

    render(<AdminWaitlistModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('tester@chicago.fm')).toBeInTheDocument();
    });

    const grantBtn = screen.getByRole('button', { name: /grant alpha/i });
    fireEvent.click(grantBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/alpha invite code successfully generated for tester@chicago.fm/i)
      ).toBeInTheDocument();
      expect(screen.getAllByText('GW-WL-TEST99').length).toBeGreaterThanOrEqual(1);
    });

    // Test copy to clipboard
    const copyBtns = screen.getAllByRole('button', { name: /copy/i });
    fireEvent.click(copyBtns[0]);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('GW-WL-TEST99');
  });

  it('promotes subscriber via quick email input form', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((input: any) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/v1/waitlist/entries')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ entries: sampleEntries }),
        } as Response);
      }
      if (url.includes('/api/v1/auth/invite/grant-waitlist')) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              inviteCode: 'GW-WL-NEWUSER1',
              message: 'Alpha invite code created',
            }),
        } as Response);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response);
    });

    render(<AdminWaitlistModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('tester@chicago.fm')).toBeInTheDocument();
    });

    const quickInput = screen.getByPlaceholderText(/promote any waitlisted email/i);
    fireEvent.change(quickInput, { target: { value: 'quick@domain.com' } });

    const submitBtn = screen.getByRole('button', { name: /grant code/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/alpha invite code successfully generated for quick@domain.com/i)
      ).toBeInTheDocument();
    });
  });

  it('handles error when grant alpha fails', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((input: any) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/api/v1/waitlist/entries')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ entries: sampleEntries }),
        } as Response);
      }
      if (url.includes('/api/v1/auth/invite/grant-waitlist')) {
        return Promise.resolve({
          ok: false,
          json: () =>
            Promise.resolve({
              error: 'Email not found on waitlist',
            }),
        } as Response);
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) } as Response);
    });

    render(<AdminWaitlistModal isOpen={true} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(screen.getByText('tester@chicago.fm')).toBeInTheDocument();
    });

    const grantBtn = screen.getByRole('button', { name: /grant alpha/i });
    fireEvent.click(grantBtn);

    await waitFor(() => {
      expect(screen.getByText('Email not found on waitlist')).toBeInTheDocument();
    });
  });

  it('calls onClose when close button is clicked', () => {
    const onCloseMock = vi.fn();
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ entries: [] }),
    } as Response);

    render(<AdminWaitlistModal isOpen={true} onClose={onCloseMock} />);

    const closeBtn = screen.getByRole('button', { name: /close admin console/i });
    fireEvent.click(closeBtn);
    expect(onCloseMock).toHaveBeenCalledTimes(1);
  });
});
