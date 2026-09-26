import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { AuthModal } from './auth-modal';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}));

function ModalTrigger({ tab = 'login' }: { tab?: 'login' | 'register' }) {
  const { openAuthModal } = useAuth();
  return <button onClick={() => openAuthModal(tab)}>Open Modal</button>;
}

describe('AuthModal Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('does not render when modal is closed', () => {
    render(
      <AuthProvider>
        <AuthModal />
      </AuthProvider>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders modal when open and allows toggling tabs', () => {
    render(
      <AuthProvider>
        <ModalTrigger />
        <AuthModal />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Open Modal'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Sign In to GroundWave')).toBeInTheDocument();

    // Toggle to register tab
    const createAccountTab = screen.getByRole('button', { name: 'Create Account' });
    fireEvent.click(createAccountTab);
    expect(screen.getByText('Create GroundWave Account')).toBeInTheDocument();
    expect(screen.getByText('Alpha Access Only — Invitation Code Required')).toBeInTheDocument();
    expect(screen.getByLabelText('Alpha Invite Code')).toBeInTheDocument();
    expect(screen.getByLabelText('Handle (@username)')).toBeInTheDocument();

    // Toggle back to sign in tab
    const signInTab = screen.getByRole('button', { name: 'Sign In' });
    fireEvent.click(signInTab);
    expect(screen.getByText('Sign In to GroundWave')).toBeInTheDocument();

    // Close modal
    const closeBtn = screen.getByRole('button', { name: 'Close dialog' });
    fireEvent.click(closeBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('submits login form and handles errors', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'User does not exist' }),
    } as Response);

    render(
      <AuthProvider>
        <ModalTrigger tab="login" />
        <AuthModal />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Open Modal'));
    const emailInput = screen.getByLabelText('Email Address');
    fireEvent.change(emailInput, { target: { value: 'notfound@user.com' } });

    const submitBtn = screen.getByRole('button', { name: 'Sign In with Email' });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('User does not exist')).toBeInTheDocument();
    });
  });

  it('closes modal when clicking launch waitlist link', () => {
    render(
      <AuthProvider>
        <ModalTrigger tab="register" />
        <AuthModal />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Open Modal'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    const waitlistBtn = screen.getByText("Don't have an invite code? Join our Launch Waitlist");
    fireEvent.click(waitlistBtn);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('submits registration form with invite code and handles errors', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: 'Handle taken' }),
    } as Response);

    render(
      <AuthProvider>
        <ModalTrigger tab="register" />
        <AuthModal />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Open Modal'));

    fireEvent.change(screen.getByLabelText('Alpha Invite Code'), { target: { value: 'gw-alpha-chicago' } });
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'new@fan.com' } });
    fireEvent.change(screen.getByLabelText('Handle (@username)'), { target: { value: 'fanhandle' } });
    fireEvent.change(screen.getByLabelText('Display Name'), { target: { value: 'Fan Name' } });

    // The register submit button text is 'Create Account' inside the form
    const buttons = screen.getAllByRole('button', { name: 'Create Account' });
    const submitBtn = buttons[buttons.length - 1];
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText('Handle taken')).toBeInTheDocument();
    });
  });

  it('triggers quick demo account sign-in', async () => {
    const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        token: 'demo-token',
        user: { id: 'u1', email: 'elena@staticveins.band', displayName: 'Elena Vance' }
      }),
    } as Response);

    render(
      <AuthProvider>
        <ModalTrigger tab="login" />
        <AuthModal />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Open Modal'));

    const demoBtn = screen.getByText('Maya Lin');
    fireEvent.click(demoBtn);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    fetchSpy.mockRestore();
  });
});
