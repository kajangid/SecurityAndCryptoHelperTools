import { describe, it, expect } from 'vitest';
import {
  generateApiKey,
  verifyApiKey,
  parseApiKey,
  maskApiKey
} from './index.js';

describe('api-key-generator', () => {
  describe('generateApiKey', () => {
    it('generates a valid API key with default prefix and checksum', () => {
      const { key, prefix, secret, checksum } = generateApiKey();

      expect(prefix).toBe('key');
      expect(secret.length).toBeGreaterThan(16);
      expect(checksum.length).toBe(8);
      expect(key.startsWith('key_')).toBe(true);
      expect(key.endsWith(`_${checksum}`)).toBe(true);
    });

    it('supports custom prefixes and delimiters', () => {
      const { key, prefix, checksum } = generateApiKey({
        prefix: 'sk_live',
        delimiter: '.'
      });

      expect(prefix).toBe('sk_live');
      expect(key.startsWith('sk_live.')).toBe(true);
      expect(key.endsWith(`.${checksum}`)).toBe(true);
    });

    it('allows omitting checksum', () => {
      const { key, checksum } = generateApiKey({
        includeChecksum: false
      });

      expect(checksum).toBe('');
      expect(key.split('_').length).toBe(2);
    });
  });

  describe('verifyApiKey', () => {
    it('successfully verifies legitimate generated keys', () => {
      const { key } = generateApiKey({ prefix: 'pk_test' });
      const result = verifyApiKey(key, { prefix: 'pk_test' });

      expect(result.valid).toBe(true);
      expect(result.prefix).toBe('pk_test');
    });

    it('fails verification when prefix does not match expected', () => {
      const { key } = generateApiKey({ prefix: 'pk_live' });
      const result = verifyApiKey(key, { prefix: 'pk_test' });

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Prefix mismatch');
    });

    it('detects 1-bit tampering in secret or checksum', () => {
      const { key } = generateApiKey({ prefix: 'sk' });
      // Tamper with one character deterministically
      const targetIdx = 10;
      const originalChar = key[targetIdx];
      const replacementChar = originalChar === 'X' ? 'Y' : 'X';
      const tampered = key.slice(0, targetIdx) + replacementChar + key.slice(targetIdx + 1);
      const result = verifyApiKey(tampered);

      expect(result.valid).toBe(false);
      expect(result.reason).toContain('Checksum integrity check failed');
    });

    it('rejects keys without checksums or empty inputs', () => {
      const noChecksum = 'sk_live_somesecretwithnochecksum';
      expect(verifyApiKey(noChecksum).valid).toBe(false);
      expect(verifyApiKey('').valid).toBe(false);
    });
  });

  describe('parseApiKey', () => {
    it('correctly splits into prefix, secret, and checksum', () => {
      const parsed = parseApiKey('proj_live_abc12345_12345678');
      expect(parsed.prefix).toBe('proj_live');
      expect(parsed.secret).toBe('abc12345');
      expect(parsed.checksum).toBe('12345678');
    });
  });

  describe('maskApiKey', () => {
    it('masks the middle of the key', () => {
      const masked = maskApiKey('sk_live_1234567890abcdef_12345678', {
        visiblePrefixChars: 7,
        visibleSuffixChars: 4
      });

      expect(masked.startsWith('sk_live')).toBe(true);
      expect(masked.endsWith('5678')).toBe(true);
      expect(masked).toContain('••••••••');
    });

    it('handles short keys without crashing', () => {
      const masked = maskApiKey('short', { visiblePrefixChars: 7, visibleSuffixChars: 4 });
      expect(masked).toBe('•••••');
    });
  });
});
