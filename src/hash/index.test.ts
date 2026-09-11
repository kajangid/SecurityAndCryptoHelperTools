import { describe, it, expect } from 'vitest';
import {
  hash,
  hashAsync,
  hmac,
  hmacAsync,
  verifyHmac,
  verifyHmacAsync
} from './index.js';

describe('hash & hmac', () => {
  const ABC = 'abc';

  describe('RFC / Known Test Vectors', () => {
    it('computes accurate SHA-256 for "abc"', () => {
      const expected = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
      expect(hash(ABC, 'SHA-256', 'hex')).toBe(expected);
    });

    it('computes accurate SHA-384 for "abc"', () => {
      const expected =
        'cb00753f45a35e8bb5a03d699ac65007272c32ab0eded1631a8b605a43ff5bed8086072ba1e7cc2358baeca134c825a7';
      expect(hash(ABC, 'SHA-384', 'hex')).toBe(expected);
    });

    it('computes accurate SHA-512 for "abc"', () => {
      const expected =
        'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f';
      expect(hash(ABC, 'SHA-512', 'hex')).toBe(expected);
    });

    it('computes accurate SHA-1 for "abc"', () => {
      const expected = 'a9993e364706816aba3e25717850c26c9cd0d89d';
      expect(hash(ABC, 'SHA-1', 'hex')).toBe(expected);
    });

    it('computes accurate MD5 for "abc"', () => {
      const expected = '900150983cd24fb0d6963f7d28e17f72';
      expect(hash(ABC, 'MD5', 'hex')).toBe(expected);
    });

    it('computes accurate HMAC-SHA256 for standard test message', () => {
      const key = 'key';
      const msg = 'The quick brown fox jumps over the lazy dog';
      const expected = 'f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8';
      expect(hmac(key, msg, 'SHA-256', 'hex')).toBe(expected);
    });
  });

  describe('Async parity with Web Crypto API', () => {
    it('hashAsync matches synchronous hash across algorithms', async () => {
      for (const algo of ['SHA-256', 'SHA-384', 'SHA-512', 'SHA-1'] as const) {
        const syncRes = hash('async-test-payload', algo, 'hex');
        const asyncRes = await hashAsync('async-test-payload', algo, 'hex');
        expect(asyncRes).toBe(syncRes);
      }
    });

    it('hmacAsync matches synchronous hmac', async () => {
      const key = 'super-secret-key-123';
      const data = 'payload-data';
      const syncHmac = hmac(key, data, 'SHA-256', 'hex');
      const asyncHmac = await hmacAsync(key, data, 'SHA-256', 'hex');
      expect(asyncHmac).toBe(syncHmac);
    });
  });

  describe('Encodings', () => {
    it('supports base64, base64url, and binary encodings', () => {
      const b64 = hash('hello', 'SHA-256', 'base64');
      expect(typeof b64).toBe('string');
      expect(b64).toMatch(/^[A-Za-z0-9+/]+={0,2}$/);

      const b64url = hash('hello', 'SHA-256', 'base64url');
      expect(typeof b64url).toBe('string');
      expect(b64url).not.toContain('+');
      expect(b64url).not.toContain('/');

      const bin = hash('hello', 'SHA-256', 'binary');
      expect(bin instanceof Uint8Array).toBe(true);
      expect((bin as Uint8Array).length).toBe(32);
    });
  });

  describe('HMAC verification', () => {
    it('verifies valid HMACs in constant time', () => {
      const key = 'my-secret';
      const data = 'secure-message';
      const digest = hmac(key, data, 'SHA-256', 'hex') as string;

      expect(verifyHmac(key, data, digest)).toBe(true);
      expect(verifyHmac(key, 'tampered-data', digest)).toBe(false);
      expect(verifyHmac('wrong-key', data, digest)).toBe(false);
    });

    it('asynchronously verifies HMACs', async () => {
      const key = 'my-secret';
      const data = 'secure-message';
      const digest = (await hmacAsync(key, data, 'SHA-256', 'hex')) as string;

      expect(await verifyHmacAsync(key, data, digest)).toBe(true);
      expect(await verifyHmacAsync(key, 'tampered-data', digest)).toBe(false);
    });
  });

  describe('Error handling', () => {
    it('rejects unsupported algorithms', () => {
      // @ts-expect-error test unsupported algorithm
      expect(() => hash('data', 'INVALID_ALGO')).toThrow(RangeError);
    });
  });
});
