import { describe, it, expect } from 'vitest';
import {
  getRandomBytes,
  randomInt,
  randomFloat,
  randomChoice,
  shuffle,
  bytesToHex,
  hexToBytes,
  bytesToBase64,
  base64ToBytes,
  bytesToBase64Url,
  base64UrlToBytes,
  stringToBytes,
  bytesToString,
  crc32,
  crc32Hex,
  timingSafeEqual
} from './index.js';

describe('crypto-utils', () => {
  describe('getRandomBytes', () => {
    it('generates buffers of exact size', () => {
      const b0 = getRandomBytes(0);
      expect(b0.length).toBe(0);

      const b32 = getRandomBytes(32);
      expect(b32.length).toBe(32);
      expect(b32 instanceof Uint8Array).toBe(true);
    });

    it('handles requests larger than Web Crypto 65536 byte chunk limit', () => {
      const large = getRandomBytes(70000);
      expect(large.length).toBe(70000);
      // Non-trivial check that values are not all zeroes
      let nonZeroCount = 0;
      for (let i = 0; i < 100; i++) {
        if (large[i] !== 0) nonZeroCount++;
      }
      expect(nonZeroCount).toBeGreaterThan(0);
    });

    it('validates size arguments', () => {
      expect(() => getRandomBytes(-1)).toThrow(RangeError);
      // @ts-expect-error test non-integer
      expect(() => getRandomBytes('32')).toThrow(TypeError);
    });
  });

  describe('randomInt', () => {
    it('returns min when min === max', () => {
      expect(randomInt(5, 5)).toBe(5);
    });

    it('uniformly samples within [min, max] across many iterations', () => {
      const min = 10;
      const max = 20;
      for (let i = 0; i < 500; i++) {
        const val = randomInt(min, max);
        expect(val).toBeGreaterThanOrEqual(min);
        expect(val).toBeLessThanOrEqual(max);
      }
    });

    it('supports negative integer ranges', () => {
      const min = -15;
      const max = -5;
      for (let i = 0; i < 100; i++) {
        const val = randomInt(min, max);
        expect(val).toBeGreaterThanOrEqual(min);
        expect(val).toBeLessThanOrEqual(max);
      }
    });

    it('rejects invalid bounds', () => {
      expect(() => randomInt(10, 5)).toThrow(RangeError);
      expect(() => randomInt(1.5, 5)).toThrow(TypeError);
    });
  });

  describe('randomFloat', () => {
    it('generates values in [0, 1)', () => {
      for (let i = 0; i < 200; i++) {
        const f = randomFloat();
        expect(f).toBeGreaterThanOrEqual(0);
        expect(f).toBeLessThan(1);
      }
    });
  });

  describe('randomChoice & shuffle', () => {
    it('selects valid elements from an array', () => {
      const items = ['a', 'b', 'c', 'd'];
      for (let i = 0; i < 50; i++) {
        expect(items).toContain(randomChoice(items));
      }
    });

    it('throws when choosing from empty array', () => {
      expect(() => randomChoice([])).toThrow(RangeError);
    });

    it('shuffles arrays without mutating source', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const copy = original.slice();
      const shuffled = shuffle(original);

      expect(original).toEqual(copy);
      expect(shuffled.length).toBe(original.length);
      expect(shuffled.sort((a, b) => a - b)).toEqual(original);
    });
  });

  describe('Encodings and Byte Conversions', () => {
    it('converts hex to bytes and back accurately', () => {
      const original = new Uint8Array([0x00, 0x1a, 0x2b, 0xff]);
      const hex = bytesToHex(original);
      expect(hex).toBe('001a2bff');
      expect(hexToBytes(hex)).toEqual(original);
    });

    it('throws on invalid hex strings', () => {
      expect(() => hexToBytes('123')).toThrow(RangeError); // odd length
      expect(() => hexToBytes('123z')).toThrow(RangeError); // invalid hex char
      // @ts-expect-error test non-string
      expect(() => hexToBytes(123)).toThrow(TypeError);
    });

    it('converts base64 to bytes and back accurately', () => {
      const text = 'Hello, World! Security Toolkit.';
      const bytes = stringToBytes(text);
      const b64 = bytesToBase64(bytes);
      const roundtrip = base64ToBytes(b64);
      expect(bytesToString(roundtrip)).toBe(text);
    });

    it('converts base64url without padding or unsafe characters', () => {
      const bytes = new Uint8Array([251, 255, 254, 253]);
      const b64url = bytesToBase64Url(bytes);
      expect(b64url).not.toContain('+');
      expect(b64url).not.toContain('/');
      expect(b64url).not.toContain('=');

      const roundtrip = base64UrlToBytes(b64url);
      expect(roundtrip).toEqual(bytes);
    });

    it('handles unicode string roundtrip', () => {
      const unicode = '🔐 Cryptography & 安全 🚀';
      const bytes = stringToBytes(unicode);
      expect(bytesToString(bytes)).toBe(unicode);
    });
  });

  describe('crc32', () => {
    it('matches known IEEE 802.3 CRC32 test vectors', () => {
      expect(crc32('')).toBe(0);
      expect(crc32Hex('')).toBe('00000000');
      // Standard CRC-32 test vector: "123456789" => 0xcbf43926 (3421780262)
      expect(crc32('123456789')).toBe(0xcbf43926 >>> 0);
      expect(crc32Hex('123456789')).toBe('cbf43926');
    });
  });

  describe('timingSafeEqual', () => {
    it('is re-exported and compares safely', () => {
      expect(timingSafeEqual('hashA', 'hashA')).toBe(true);
      expect(timingSafeEqual('hashA', 'hashB')).toBe(false);
    });
  });
});
