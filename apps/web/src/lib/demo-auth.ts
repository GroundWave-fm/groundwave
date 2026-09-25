export const DEMO_COOKIE_NAME = 'gw_demo_access';

export async function hashDemoPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`gw_demo_salt_${password}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
