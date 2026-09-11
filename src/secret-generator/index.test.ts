import { describe, it, expect } from 'vitest';
import {
  generateSecret,
  generatePassphrase,
  estimateSecretEntropy
} from './index.js';

describe('secret-generator', () => {
  describe('generateSecret', () => {
    it('generates 256-bit hex secret by default', () => {
      const res = generateSecret();
      expect(res.bits).toBe(256);
      expect(res.format).toBe('hex');
      expect((res.secret as string).length).toBe(64); // 32 bytes = 64 hex characters
      expect(res.entropy).toBe(256);
    });

    it('supports 128-bit base64 secrets', () => {
      const res = generateSecret({ bits: 128, format: 'base64' });
      expect(res.bits).toBe(128);
      expect(res.format).toBe('base64');
      expect(typeof res.secret).toBe('string');
    });

    it('supports base64url and binary outputs', () => {
      const resUrl = generateSecret({ bits: 512, format: 'base64url' });
      expect(resUrl.bits).toBe(512);
      expect((resUrl.secret as string)).not.toContain('+');
      expect((resUrl.secret as string)).not.toContain('/');

      const resBin = generateSecret({ bits: 128, format: 'binary' });
      expect(resBin.secret instanceof Uint8Array).toBe(true);
      expect((resBin.secret as Uint8Array).length).toBe(16);
    });

    it('validates bit boundaries', () => {
      expect(() => generateSecret({ bits: 125 })).toThrow(RangeError); // not multiple of 8
      expect(() => generateSecret({ bits: 32 })).toThrow(RangeError); // below min 64
    });
  });

  describe('generatePassphrase', () => {
    it('generates a 6-word passphrase with hyphen separator', () => {
      const res = generatePassphrase();
      const parts = res.passphrase.split('-');
      expect(parts.length).toBe(6);
      expect(res.words).toBe(6);
      expect(res.entropy).toBe(66);
    });

    it('supports custom word count, separator, and capitalization', () => {
      const res = generatePassphrase({
        words: 8,
        separator: ' ',
        capitalize: true
      });

      const parts = res.passphrase.split(' ');
      expect(parts.length).toBe(8);
      expect(res.entropy).toBe(88);
      for (const word of parts) {
        expect(word[0]).toBe(word[0].toUpperCase());
      }
    });

    it('supports appending numbers for additional entropy', () => {
      const res = generatePassphrase({
        words: 4,
        includeNumber: true
      });

      expect(res.entropy).toBeGreaterThan(44);
      expect(/\d+$/.test(res.passphrase)).toBe(true);
    });

    it('validates word count boundaries', () => {
      expect(() => generatePassphrase({ words: 2 })).toThrow(RangeError);
      expect(() => generatePassphrase({ words: 50 })).toThrow(RangeError);
    });
  });

  describe('estimateSecretEntropy', () => {
    it('handles empty inputs', () => {
      expect(estimateSecretEntropy('').bits).toBe(0);
    });

    it('detects high entropy for random secret buffers', () => {
      const secret = generateSecret({ bits: 256, format: 'hex' });
      const est = estimateSecretEntropy(secret.secret);
      expect(est.bits).toBeGreaterThan(150);
      expect(['high', 'very_high']).toContain(est.strength);
    });

    it('detects low entropy for repetitive content', () => {
      const est = estimateSecretEntropy('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa');
      expect(est.bits).toBe(0);
      expect(est.strength).toBe('low');
    });
  });
});
