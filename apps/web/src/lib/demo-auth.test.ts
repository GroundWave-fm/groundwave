import { describe, it, expect } from 'vitest';
import { hashDemoPassword, DEMO_COOKIE_NAME } from './demo-auth';

describe('Demo Auth Helper', () => {
  it('exports expected cookie name', () => {
    expect(DEMO_COOKIE_NAME).toBe('gw_demo_access');
  });

  it('generates deterministic SHA-256 hash for password', async () => {
    const hash1 = await hashDemoPassword('test_password');
    const hash2 = await hashDemoPassword('test_password');
    const diffHash = await hashDemoPassword('other_password');

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64);
    expect(hash1).not.toBe(diffHash);
  });
});
