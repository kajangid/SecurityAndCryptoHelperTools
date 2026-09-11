import { describe, it, expect, vi } from 'vitest';
import {
  generateSignedLink,
  verifySignedLink,
  createPasswordResetLink,
  createMagicLink
} from './index.js';

describe('link', () => {
  const SECRET = 'test-signing-key-12345';
  const BASE_URL = 'https://api.example.com/auth/verify';

  describe('generateSignedLink', () => {
    it('generates a URL containing token, expiration, and signature', () => {
      const signed = generateSignedLink({
        baseUrl: BASE_URL,
        secret: SECRET,
        expiresIn: '30m',
        params: { accountId: 'acc_99' }
      });

      expect(signed.url).toContain('https://api.example.com/auth/verify?');
      expect(signed.url).toContain('accountId=acc_99');
      expect(signed.url).toContain('token=');
      expect(signed.url).toContain('exp=');
      expect(signed.url).toContain('sig=');
      expect(signed.token.length).toBeGreaterThan(16);
      expect(signed.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    it('works with relative URLs', () => {
      const signed = generateSignedLink({
        baseUrl: '/verify-email',
        secret: SECRET
      });

      expect(signed.url.startsWith('/verify-email?')).toBe(true);
      const verified = verifySignedLink(signed.url, SECRET);
      expect(verified.valid).toBe(true);
    });
  });

  describe('verifySignedLink', () => {
    it('successfully validates legitimate untouched links', () => {
      const signed = generateSignedLink({
        baseUrl: BASE_URL,
        secret: SECRET,
        expiresIn: '1h',
        params: { role: 'admin' }
      });

      const verification = verifySignedLink(signed.url, SECRET);
      expect(verification.valid).toBe(true);
      expect(verification.expired).toBe(false);
      expect(verification.tampered).toBe(false);
      expect(verification.params['role']).toBe('admin');
    });

    it('detects tampering when query parameters are changed or added', () => {
      const signed = generateSignedLink({
        baseUrl: BASE_URL,
        secret: SECRET,
        params: { role: 'user' }
      });

      // Attacker tries to elevate role
      const tamperedUrl = signed.url.replace('role=user', 'role=admin');
      const verification = verifySignedLink(tamperedUrl, SECRET);

      expect(verification.valid).toBe(false);
      expect(verification.tampered).toBe(true);
      expect(verification.reason).toContain('Invalid signature');
    });

    it('detects tampering when signature is altered', () => {
      const signed = generateSignedLink({
        baseUrl: BASE_URL,
        secret: SECRET
      });

      const tamperedUrl = signed.url.slice(0, -4) + 'abcd';
      const verification = verifySignedLink(tamperedUrl, SECRET);

      expect(verification.valid).toBe(false);
      expect(verification.tampered).toBe(true);
    });

    it('detects expired links', () => {
      const signed = generateSignedLink({
        baseUrl: BASE_URL,
        secret: SECRET,
        expiresIn: '1s'
      });

      // Fast forward time by 2 minutes
      vi.useFakeTimers();
      vi.advanceTimersByTime(120 * 1000);

      const verification = verifySignedLink(signed.url, SECRET, {
        tolerance: 0
      });

      expect(verification.valid).toBe(false);
      expect(verification.expired).toBe(true);
      expect(verification.tampered).toBe(false);
      expect(verification.reason).toContain('expired');

      vi.useRealTimers();
    });

    it('handles missing signatures and malformed URLs', () => {
      expect(verifySignedLink('https://example.com/no-sig', SECRET).tampered).toBe(true);
      expect(verifySignedLink('', SECRET).valid).toBe(false);
      expect(verifySignedLink('https://example.com', '').valid).toBe(false);
    });
  });

  describe('Specialized Helpers', () => {
    it('creates and verifies password reset links', () => {
      const link = createPasswordResetLink(BASE_URL, SECRET, 'user_456', '15m');
      expect(link.url).toContain('userId=user_456');
      expect(link.url).toContain('action=password_reset');

      const verified = verifySignedLink(link.url, SECRET);
      expect(verified.valid).toBe(true);
      expect(verified.params['userId']).toBe('user_456');
    });

    it('creates and verifies magic login links', () => {
      const link = createMagicLink(BASE_URL, SECRET, 'test@example.com', '10m');
      expect(link.url).toContain('email=test%40example.com');
      expect(link.url).toContain('action=magic_login');

      const verified = verifySignedLink(link.url, SECRET);
      expect(verified.valid).toBe(true);
      expect(verified.params['email']).toBe('test@example.com');
    });
  });
});
