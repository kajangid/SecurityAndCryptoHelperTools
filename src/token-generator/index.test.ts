import { describe, it, expect } from 'vitest';
import {
  generateToken,
  generateAlphanumericToken,
  generateNumericToken,
  generateHexToken,
  generateBase64UrlToken,
  generateUuid,
  generateNanoId,
  generateCustomToken,
  validateTokenFormat
} from './index.js';

describe('token-generator', () => {
  describe('generateAlphanumericToken', () => {
    it('generates exact length alphanumeric strings', () => {
      const token = generateAlphanumericToken(32);
      expect(token.length).toBe(32);
      expect(validateTokenFormat(token, 'alphanumeric')).toBe(true);
    });
  });

  describe('generateNumericToken', () => {
    it('generates digits-only OTP codes', () => {
      const pin = generateNumericToken(6);
      expect(pin.length).toBe(6);
      expect(validateTokenFormat(pin, 'numeric')).toBe(true);
    });
  });

  describe('generateHexToken', () => {
    it('generates hex token with twice the character count of bytes', () => {
      const hex = generateHexToken(16);
      expect(hex.length).toBe(32);
      expect(validateTokenFormat(hex, 'hex')).toBe(true);
    });
  });

  describe('generateBase64UrlToken', () => {
    it('generates URL safe base64 tokens without padding', () => {
      const token = generateBase64UrlToken(32);
      expect(validateTokenFormat(token, 'base64url')).toBe(true);
      expect(token).not.toContain('+');
      expect(token).not.toContain('/');
      expect(token).not.toContain('=');
    });
  });

  describe('generateUuid', () => {
    it('generates compliant RFC 4122 v4 UUIDs', () => {
      const uuid = generateUuid();
      expect(validateTokenFormat(uuid, 'uuid')).toBe(true);
      expect(uuid.charAt(14)).toBe('4'); // version 4
      expect(['8', '9', 'a', 'b']).toContain(uuid.charAt(19).toLowerCase()); // variant
    });

    it('guarantees collision resistance across multiple runs', () => {
      const set = new Set<string>();
      for (let i = 0; i < 500; i++) {
        set.add(generateUuid());
      }
      expect(set.size).toBe(500);
    });
  });

  describe('generateNanoId & generateCustomToken', () => {
    it('generates custom alphabet tokens', () => {
      const custom = generateCustomToken(12, 'ABCDEF012345');
      expect(custom.length).toBe(12);
      expect(/^[ABCDEF012345]+$/.test(custom)).toBe(true);
    });

    it('generates nanoid strings', () => {
      const nid = generateNanoId(16);
      expect(nid.length).toBe(16);
      expect(validateTokenFormat(nid, 'nanoid')).toBe(true);
    });
  });

  describe('generateToken (universal dispatcher)', () => {
    it('applies prefix and suffix correctly', () => {
      const token = generateToken({
        type: 'alphanumeric',
        length: 16,
        prefix: 'usr_',
        suffix: '_test'
      });

      expect(token.startsWith('usr_')).toBe(true);
      expect(token.endsWith('_test')).toBe(true);
      expect(token.length).toBe(4 + 16 + 5);
    });

    it('throws on custom type without customAlphabet', () => {
      expect(() => generateToken({ type: 'custom' })).toThrow(TypeError);
    });
  });

  describe('validateTokenFormat', () => {
    it('accurately identifies invalid formats', () => {
      expect(validateTokenFormat('invalid hex!', 'hex')).toBe(false);
      expect(validateTokenFormat('123a', 'numeric')).toBe(false);
      expect(validateTokenFormat('not-a-uuid', 'uuid')).toBe(false);
      expect(validateTokenFormat('', 'alphanumeric')).toBe(false);
    });
  });
});
