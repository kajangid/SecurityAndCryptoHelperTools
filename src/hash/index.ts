/**
 * Cryptographic hashing and HMAC digests.
 * Supports SHA-256, SHA-384, SHA-512, SHA-1, and MD5 across Node.js, Browsers, Deno, Bun, and Workers.
 */

import {
  Encoding,
  HashAlgorithm,
  HmacVerifyOptions
} from '../shared/types.js';
import {
  stringToBytes,
  bytesToHex,
  bytesToBase64,
  bytesToBase64Url,
  timingSafeEqual
} from '../crypto-utils/index.js';
import { createHash, createHmac } from 'node:crypto';

/**
 * Pure JavaScript SHA-256 implementation ensuring synchronous hashing
 * even in environments lacking node:crypto (e.g. browser main thread).
 */
function sha256Sync(dataBytes: Uint8Array): Uint8Array {
  const K = new Uint32Array([
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ]);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const len = dataBytes.length;
  const bitLen = len * 8;

  // Pre-processing: padding
  const totalLen = (((len + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(totalLen);
  padded.set(dataBytes);
  padded[len] = 0x80;

  // Append length in bits (big-endian 64-bit integer, using safe bit shifts)
  const view = new DataView(padded.buffer);
  const highBits = Math.floor(bitLen / 0x100000000);
  const lowBits = bitLen >>> 0;
  view.setUint32(totalLen - 8, highBits, false);
  view.setUint32(totalLen - 4, lowBits, false);

  const w = new Uint32Array(64);

  // Process the message in successive 512-bit (64-byte) chunks
  for (let offset = 0; offset < totalLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 =
        ((w[i - 15] >>> 7) | (w[i - 15] << 25)) ^
        ((w[i - 15] >>> 18) | (w[i - 15] << 14)) ^
        (w[i - 15] >>> 3);
      const s1 =
        ((w[i - 2] >>> 17) | (w[i - 2] << 15)) ^
        ((w[i - 2] >>> 19) | (w[i - 2] << 13)) ^
        (w[i - 2] >>> 10);
      w[i] = (((w[i - 16] + s0) >>> 0) + ((w[i - 7] + s1) >>> 0)) >>> 0;
    }

    let a = h0;
    let b = h1;
    let c = h2;
    let d = h3;
    let e = h4;
    let f = h5;
    let g = h6;
    let h = h7;

    for (let i = 0; i < 64; i++) {
      const S1 =
        ((e >>> 6) | (e << 26)) ^
        ((e >>> 11) | (e << 21)) ^
        ((e >>> 25) | (e << 7));
      const ch = (e & f) ^ (~e & g);
      const temp1 = ((((h + S1) >>> 0) + ((ch + K[i]) >>> 0)) >>> 0) + w[i];
      const S0 =
        ((a >>> 2) | (a << 30)) ^
        ((a >>> 13) | (a << 19)) ^
        ((a >>> 22) | (a << 10));
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const result = new Uint8Array(32);
  const resView = new DataView(result.buffer);
  resView.setUint32(0, h0, false);
  resView.setUint32(4, h1, false);
  resView.setUint32(8, h2, false);
  resView.setUint32(12, h3, false);
  resView.setUint32(16, h4, false);
  resView.setUint32(20, h5, false);
  resView.setUint32(24, h6, false);
  resView.setUint32(28, h7, false);

  return result;
}

/**
 * Formats a raw Uint8Array digest into the requested encoding.
 */
function encodeDigest(digest: Uint8Array, encoding: Encoding): string | Uint8Array {
  switch (encoding) {
    case 'binary':
      return digest;
    case 'base64':
      return bytesToBase64(digest);
    case 'base64url':
      return bytesToBase64Url(digest);
    case 'hex':
    default:
      return bytesToHex(digest);
  }
}

/**
 * Normalizes algorithm name to standard formats.
 */
function normalizeAlgorithm(algo: string): string {
  const upper = algo.toUpperCase().replace(/[-_]/g, '');
  if (upper === 'SHA256') return 'SHA-256';
  if (upper === 'SHA384') return 'SHA-384';
  if (upper === 'SHA512') return 'SHA-512';
  if (upper === 'SHA1') return 'SHA-1';
  if (upper === 'MD5') return 'MD5';
  throw new RangeError(`Unsupported hash algorithm: "${algo}". Supported: SHA-256, SHA-384, SHA-512, SHA-1, MD5.`);
}

/**
 * Synchronous hash computation.
 */
export function hash(
  data: string | Uint8Array,
  algorithm: HashAlgorithm = 'SHA-256',
  encoding: Encoding = 'hex'
): string | Uint8Array {
  const normAlgo = normalizeAlgorithm(algorithm);
  const dataBytes = typeof data === 'string' ? stringToBytes(data) : data;

  try {
    const nodeAlgo = normAlgo.toLowerCase().replace('-', '');
    const h = createHash(nodeAlgo);
    h.update(dataBytes);
    const digest = new Uint8Array(h.digest());
    return encodeDigest(digest, encoding);
  } catch {
    // If createHash is unavailable or fails, fall through to pure JS
  }

  // Fallback for pure JS SHA-256
  if (normAlgo === 'SHA-256') {
    const digest = sha256Sync(dataBytes);
    return encodeDigest(digest, encoding);
  }

  throw new Error(
    `Synchronous hash for ${normAlgo} requires node:crypto or use hashAsync() for Web Crypto API.`
  );
}

/**
 * Asynchronous hash computation using standard Web Crypto API with node:crypto fallback.
 */
export async function hashAsync(
  data: string | Uint8Array,
  algorithm: HashAlgorithm = 'SHA-256',
  encoding: Encoding = 'hex'
): Promise<string | Uint8Array> {
  const normAlgo = normalizeAlgorithm(algorithm);
  const dataBytes = typeof data === 'string' ? stringToBytes(data) : data;

  // Web Crypto API supports SHA-1, SHA-256, SHA-384, SHA-512
  if (normAlgo !== 'MD5' && globalThis.crypto?.subtle) {
    const buffer = await globalThis.crypto.subtle.digest(normAlgo, dataBytes as unknown as BufferSource);
    return encodeDigest(new Uint8Array(buffer), encoding);
  }

  // Node.js fallback or MD5
  return hash(data, algorithm, encoding);
}

/**
 * Synchronous HMAC computation.
 */
export function hmac(
  key: string | Uint8Array,
  data: string | Uint8Array,
  algorithm: HashAlgorithm = 'SHA-256',
  encoding: Encoding = 'hex'
): string | Uint8Array {
  const normAlgo = normalizeAlgorithm(algorithm);
  const keyBytes = typeof key === 'string' ? stringToBytes(key) : key;
  const dataBytes = typeof data === 'string' ? stringToBytes(data) : data;

  try {
    const nodeAlgo = normAlgo.toLowerCase().replace('-', '');
    const h = createHmac(nodeAlgo, keyBytes);
    h.update(dataBytes);
    const digest = new Uint8Array(h.digest());
    return encodeDigest(digest, encoding);
  } catch {
    // If createHmac is unavailable or fails, fall through to pure JS
  }

  // Pure JS HMAC-SHA256
  if (normAlgo === 'SHA-256') {
    const blockSize = 64;
    let formattedKey = new Uint8Array(blockSize);

    if (keyBytes.length > blockSize) {
      const hashedKey = sha256Sync(keyBytes);
      formattedKey.set(hashedKey);
    } else {
      formattedKey.set(keyBytes);
    }

    const oKeyPad = new Uint8Array(blockSize);
    const iKeyPad = new Uint8Array(blockSize);

    for (let i = 0; i < blockSize; i++) {
      oKeyPad[i] = formattedKey[i] ^ 0x5c;
      iKeyPad[i] = formattedKey[i] ^ 0x36;
    }

    const innerData = new Uint8Array(blockSize + dataBytes.length);
    innerData.set(iKeyPad);
    innerData.set(dataBytes, blockSize);
    const innerHash = sha256Sync(innerData);

    const outerData = new Uint8Array(blockSize + innerHash.length);
    outerData.set(oKeyPad);
    outerData.set(innerHash, blockSize);
    const outerHash = sha256Sync(outerData);

    return encodeDigest(outerHash, encoding);
  }

  throw new Error(`Synchronous HMAC for ${normAlgo} requires node:crypto or use hmacAsync().`);
}

/**
 * Asynchronous HMAC computation using standard Web Crypto API.
 */
export async function hmacAsync(
  key: string | Uint8Array,
  data: string | Uint8Array,
  algorithm: HashAlgorithm = 'SHA-256',
  encoding: Encoding = 'hex'
): Promise<string | Uint8Array> {
  const normAlgo = normalizeAlgorithm(algorithm);
  const keyBytes = typeof key === 'string' ? stringToBytes(key) : key;
  const dataBytes = typeof data === 'string' ? stringToBytes(data) : data;

  if (normAlgo !== 'MD5' && globalThis.crypto?.subtle) {
    const cryptoKey = await globalThis.crypto.subtle.importKey(
      'raw',
      keyBytes as unknown as BufferSource,
      { name: 'HMAC', hash: { name: normAlgo } },
      false,
      ['sign']
    );

    const sig = await globalThis.crypto.subtle.sign('HMAC', cryptoKey, dataBytes as unknown as BufferSource);
    return encodeDigest(new Uint8Array(sig), encoding);
  }

  return hmac(key, data, algorithm, encoding);
}

/**
 * Verifies an HMAC digest in constant time to prevent timing side-channel attacks.
 */
export function verifyHmac(
  key: string | Uint8Array,
  data: string | Uint8Array,
  expectedHmac: string,
  options: HmacVerifyOptions = {}
): boolean {
  const algorithm = options.algorithm ?? 'SHA-256';
  const encoding = options.encoding ?? 'hex';

  const actual = hmac(key, data, algorithm, encoding);
  if (typeof actual !== 'string') {
    throw new TypeError('Expected actual HMAC to be a string format.');
  }

  return timingSafeEqual(actual, expectedHmac);
}

/**
 * Asynchronous constant-time HMAC verification.
 */
export async function verifyHmacAsync(
  key: string | Uint8Array,
  data: string | Uint8Array,
  expectedHmac: string,
  options: HmacVerifyOptions = {}
): Promise<boolean> {
  const algorithm = options.algorithm ?? 'SHA-256';
  const encoding = options.encoding ?? 'hex';

  const actual = await hmacAsync(key, data, algorithm, encoding);
  if (typeof actual !== 'string') {
    throw new TypeError('Expected actual HMAC to be a string format.');
  }

  return timingSafeEqual(actual, expectedHmac);
}
