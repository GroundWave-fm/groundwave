import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WaitlistForm } from './waitlist-form';

vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <div ref={ref} {...props}>
        {children}
      </div>
    )),
    form: React.forwardRef(({ children, ...props }: any, ref: any) => (
      <form ref={ref} {...props}>
        {children}
      </form>
    )),
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('WaitlistForm Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders input, persona selection pills, and submit button', () => {
    render(<WaitlistForm />);

    expect(screen.getByPlaceholderText('Enter your email...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Fan \/ Listener/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Artist \/ Band/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Label \/ Venue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Join Waitlist/i })).toBeInTheDocument();
  });

  it('allows toggling between user types', () => {
    render(<WaitlistForm />);

    const artistBtn = screen.getByRole('button', { name: /Artist \/ Band/i });
    fireEvent.click(artistBtn);

    expect(artistBtn.className).toContain('bg-sky-500');
  });

  it('shows error feedback when email is invalid', async () => {
    render(<WaitlistForm />);

    const emailInput = screen.getByPlaceholderText('Enter your email...');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

    const form = emailInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Please provide a valid email address.')).toBeInTheDocument();
    });
  });

  it('submits successfully and renders VIP confirmation', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () =>
        Promise.resolve({
          success: true,
          message: 'Welcome to the GroundWave waitlist! Stay tuned for early access.',
          alreadyRegistered: false,
        }),
    } as unknown as Response);

    render(<WaitlistForm />);

    const emailInput = screen.getByPlaceholderText('Enter your email...');
    fireEvent.change(emailInput, { target: { value: 'musiclover@example.com' } });

    const form = emailInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/You’re on the VIP Waitlist!/i)).toBeInTheDocument();
      expect(screen.getByText(/Welcome to the GroundWave waitlist/i)).toBeInTheDocument();
    });

    // Test register another email reset
    const resetBtn = screen.getByRole('button', { name: /Register another email/i });
    fireEvent.click(resetBtn);

    expect(screen.getByPlaceholderText('Enter your email...')).toBeInTheDocument();
  });

  it('handles already registered emails gracefully', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      headers: { get: () => 'application/json' },
      json: () =>
        Promise.resolve({
          success: true,
          message: "You're already on the waitlist! We'll reach out when GroundWave arrives in your city.",
          alreadyRegistered: true,
        }),
    } as unknown as Response);

    render(<WaitlistForm />);

    const emailInput = screen.getByPlaceholderText('Enter your email...');
    fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });

    const form = emailInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/Already on the List!/i)).toBeInTheDocument();
      expect(screen.getByText(/already on the waitlist/i)).toBeInTheDocument();
    });
  });

  it('handles API error responses in JSON format', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: { get: () => 'application/json' },
      json: () => Promise.resolve({ error: 'Rate limit exceeded' }),
    } as unknown as Response);

    render(<WaitlistForm />);

    const emailInput = screen.getByPlaceholderText('Enter your email...');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const form = emailInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Rate limit exceeded')).toBeInTheDocument();
    });
  });

  it('handles non-JSON / HTML error responses gracefully without throwing syntax errors', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: { get: () => 'text/html' },
      text: () => Promise.resolve('<!DOCTYPE html><html><body>404 Not Found</body></html>'),
    } as unknown as Response);

    render(<WaitlistForm />);

    const emailInput = screen.getByPlaceholderText('Enter your email...');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const form = emailInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText(/404 Not Found/i)).toBeInTheDocument();
    });
  });

  it('handles network exceptions gracefully', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network offline'));

    render(<WaitlistForm />);

    const emailInput = screen.getByPlaceholderText('Enter your email...');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const form = emailInput.closest('form')!;
    fireEvent.submit(form);

    await waitFor(() => {
      expect(screen.getByText('Network offline')).toBeInTheDocument();
    });
  });
});
