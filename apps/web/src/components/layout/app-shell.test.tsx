import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '@/context/auth-context';
import { AudioProvider } from '@/context/audio-context';
import { AppShell } from './app-shell';

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => "/",
}));

describe('AppShell & Layout Components', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders brand name, navigation items, and search header in guest mode', () => {
    render(
      <AudioProvider><AuthProvider>
        <AppShell>
          <div data-testid="page-content">Home Content</div>
        </AppShell>
      </AuthProvider></AudioProvider>
    );

    expect(screen.getByText('GroundWave')).toBeInTheDocument();
    expect(screen.getByText('Home Feed')).toBeInTheDocument();
    expect(screen.getByText('Scene Radio')).toBeInTheDocument();
    expect(screen.getByText('Creator Studio')).toBeInTheDocument();
    expect(screen.getByTestId('page-content')).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('Search local artists, scene radios, tape labels, venues...')
    ).toBeInTheDocument();
  });

  it('allows scene dropdown selection and updates header scene badge', () => {
    render(
      <AudioProvider><AuthProvider>
        <AppShell>
          <div>Body</div>
        </AppShell>
      </AuthProvider></AudioProvider>
    );

    const sceneBtn = screen.getByText(/Chicago Scene/i);
    fireEvent.click(sceneBtn);

    expect(screen.getByText('Local Scene Discovery')).toBeInTheDocument();

    const austinOption = screen.getByText(/Austin, TX/i);
    fireEvent.click(austinOption);

    expect(screen.getByText(/Austin Scene/i)).toBeInTheDocument();
  });

  it('renders user menu and allows switching active entity when logged in', () => {
    localStorage.setItem('groundwave_auth_token', 'mock-token');
    localStorage.setItem(
      'groundwave_auth_user',
      JSON.stringify({ id: 'u1', username: 'elena', displayName: 'Elena Vance', email: 'elena@staticveins.band' })
    );
    localStorage.setItem(
      'groundwave_auth_entities',
      JSON.stringify([
        { id: 'e1', name: 'The Static Veins', slug: 'static_veins', role: 'owner', royaltySplitPct: 50, verificationStatus: 'verified' }
      ])
    );

    render(
      <AudioProvider><AuthProvider>
        <AppShell>
          <div>Body</div>
        </AppShell>
      </AuthProvider></AudioProvider>
    );

    // Click on user menu button in the header
    const userMenuButton = screen.getByRole('button', { name: /Elena Vance/i });
    fireEvent.click(userMenuButton);

    expect(screen.getByText(/Active Creator Context/i)).toBeInTheDocument();

    // Select the entity from the dropdown menu
    const entityMenuOptions = screen.getAllByText('The Static Veins');
    // The option in the dropdown is the last element
    fireEvent.click(entityMenuOptions[entityMenuOptions.length - 1]);

    // Click on the updated user menu button to open sign out
    const updatedMenuButton = screen.getByRole('button', { name: /The Static Veins/i });
    fireEvent.click(updatedMenuButton);

    const signOutBtn = screen.getByRole('button', { name: /Sign Out/i });
    fireEvent.click(signOutBtn);

    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('opens auth modal when clicking Sign In', () => {
    render(
      <AudioProvider><AuthProvider>
        <AppShell>
          <div>Body</div>
        </AppShell>
      </AuthProvider></AudioProvider>
    );

    const signInBtn = screen.getByRole('button', { name: 'Sign In' });
    fireEvent.click(signInBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Sign In to GroundWave')).toBeInTheDocument();
  });

  it('opens auth modal on register tab when clicking Get Started', () => {
    render(
      <AudioProvider><AuthProvider>
        <AppShell>
          <div>Body</div>
        </AppShell>
      </AuthProvider></AudioProvider>
    );

    const getStartedBtn = screen.getByRole('button', { name: 'Get Started' });
    fireEvent.click(getStartedBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create GroundWave Account')).toBeInTheDocument();
  });

  it('opens auth modal when clicking Launch Studio CTA as a guest', () => {
    render(
      <AudioProvider><AuthProvider>
        <AppShell>
          <div>Body</div>
        </AppShell>
      </AuthProvider></AudioProvider>
    );

    const launchStudioBtn = screen.getByRole('button', { name: /Launch Studio/i });
    fireEvent.click(launchStudioBtn);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Create GroundWave Account')).toBeInTheDocument();
  });
});
