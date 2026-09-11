/**
 * Safe, consistent wrappers around platform-native cryptographic primitives.
 * Works seamlessly across Node.js (>=18), Browsers, Deno, Bun, and Cloudflare Workers.
 */

import { validateLength } from '../shared/security.js';

export { timingSafeEqual } from '../shared/security.js';

const WEB_CRYPTO_CHUNK_LIMIT = 65536;

/**
 * Generates a Uint8Array filled with cryptographically secure random bytes.
 */
export function getRandomBytes(size: number): Uint8Array {
  validateLength(size, 0, 100_000_000, 'Size');

  const bytes = new Uint8Array(size);
  if (size === 0) return bytes;

  const cryptoObj = globalThis.crypto;
  if (!cryptoObj || typeof cryptoObj.getRandomValues !== 'function') {
    throw new Error('Cryptographically secure random number generator is not available in this environment.');
  }

  // Web Crypto getRandomValues has a quota limit of 65536 bytes per call
  if (size <= WEB_CRYPTO_CHUNK_LIMIT) {
    cryptoObj.getRandomValues(bytes);
  } else {
    for (let offset = 0; offset < size; offset += WEB_CRYPTO_CHUNK_LIMIT) {
      const end = Math.min(offset + WEB_CRYPTO_CHUNK_LIMIT, size);
      const chunk = new Uint8Array(bytes.buffer, bytes.byteOffset + offset, end - offset);
      cryptoObj.getRandomValues(chunk);
    }
  }

  return bytes;
}

/**
 * Generates a cryptographically secure random 32-bit unsigned integer.
 */
function randomUint32(): number {
  const bytes = getRandomBytes(4);
  return (
    ((bytes[0] << 24) |
      (bytes[1] << 16) |
      (bytes[2] << 8) |
      bytes[3]) >>> 0
  );
}

/**
 * Returns an unbiased cryptographically secure integer in the inclusive range [min, max].
 * Implements rejection sampling to eliminate modulo bias.
 */
export function randomInt(min: number, max: number): number {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new TypeError('Bounds must be integers.');
  }
  if (min > max) {
    throw new RangeError(`Minimum (${min}) cannot be greater than maximum (${max}).`);
  }
  if (min === max) {
    return min;
  }

  const range = max - min + 1;
  if (range <= 0 || range > 0xffffffff) {
    throw new RangeError('Range between min and max cannot exceed 2^32 - 1.');
  }

  const maxValid = Math.floor(0x100000000 / range) * range;

  let x: number;
  do {
    x = randomUint32();
  } while (x >= maxValid);

  return min + (x % range);
}

/**
 * Returns a cryptographically secure uniform floating-point number in [0, 1).
 * Uses 53 bits of random precision matching IEEE 754 double precision mantissa.
 */
export function randomFloat(): number {
  const bytes = getRandomBytes(7);
  // Construct a 53-bit random integer
  const high = ((bytes[0] << 16) | (bytes[1] << 8) | bytes[2]) & 0x1fffff;
  const low = ((bytes[3] << 24) | (bytes[4] << 16) | (bytes[5] << 8) | bytes[6]) >>> 0;
  const int53 = high * 0x100000000 + low;
  return int53 / 0x20000000000000; // 2^53
}

/**
 * Selects a random element from a non-empty array with uniform probability.
 */
export function randomChoice<T>(array: readonly T[]): T {
  if (!Array.isArray(array) || array.length === 0) {
    throw new RangeError('Cannot choose from an empty array.');
  }
  const index = randomInt(0, array.length - 1);
  return array[index];
}

/**
 * Shuffles an array using the Fisher-Yates algorithm and cryptographic randomness.
 * Returns a new shuffled array without mutating the input.
 */
export function shuffle<T>(array: readonly T[]): T[] {
  if (!Array.isArray(array)) {
    throw new TypeError('Input must be an array.');
  }
  const copy = array.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = randomInt(0, i);
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

// --------------------------------------------------------------------------
// Encodings & String Helpers (Zero External Dependencies)
// --------------------------------------------------------------------------

const HEX_CHARS = '0123456789abcdef';

/**
 * Converts a Uint8Array to a lowercase hexadecimal string.
 */
export function bytesToHex(bytes: Uint8Array): string {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    hex += HEX_CHARS[(b >> 4) & 0x0f] + HEX_CHARS[b & 0x0f];
  }
  return hex;
}

/**
 * Converts a hexadecimal string to a Uint8Array.
 */
export function hexToBytes(hex: string): Uint8Array {
  if (typeof hex !== 'string') {
    throw new TypeError('Hex argument must be a string.');
  }
  const cleanHex = hex.trim();
  if (cleanHex.length % 2 !== 0) {
    throw new RangeError('Hex string must have an even length.');
  }
  if (!/^[0-9a-fA-F]*$/.test(cleanHex)) {
    throw new RangeError('Invalid hexadecimal characters detected.');
  }

  const length = cleanHex.length / 2;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/**
 * Converts a Uint8Array to a standard Base64 string.
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let result = '';
  const len = bytes.length;
  let i = 0;

  while (i < len) {
    const b0 = bytes[i++];
    const b1 = i < len ? bytes[i++] : NaN;
    const b2 = i < len ? bytes[i++] : NaN;

    const u24 = (b0 << 16) | (isNaN(b1) ? 0 : b1 << 8) | (isNaN(b2) ? 0 : b2);

    result += B64_CHARS[(u24 >> 18) & 63];
    result += B64_CHARS[(u24 >> 12) & 63];
    result += isNaN(b1) ? '=' : B64_CHARS[(u24 >> 6) & 63];
    result += isNaN(b2) ? '=' : B64_CHARS[u24 & 63];
  }

  return result;
}

/**
 * Converts a Base64 string to a Uint8Array.
 */
export function base64ToBytes(base64: string): Uint8Array {
  if (typeof base64 !== 'string') {
    throw new TypeError('Base64 argument must be a string.');
  }
  const clean = base64.trim().replace(/[\r\n\s]/g, '');
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(clean)) {
    throw new RangeError('Invalid Base64 string.');
  }

  const b64Lookup: Record<string, number> = {};
  for (let j = 0; j < B64_CHARS.length; j++) {
    b64Lookup[B64_CHARS[j]] = j;
  }

  let padding = 0;
  if (clean.endsWith('==')) padding = 2;
  else if (clean.endsWith('=')) padding = 1;

  const validLen = clean.length - padding;
  const byteLen = Math.floor((clean.length * 3) / 4) - padding;
  const bytes = new Uint8Array(byteLen);

  let byteIdx = 0;
  for (let i = 0; i < validLen; i += 4) {
    const c0 = b64Lookup[clean[i]];
    const c1 = i + 1 < validLen ? b64Lookup[clean[i + 1]] : 0;
    const c2 = i + 2 < validLen ? b64Lookup[clean[i + 2]] : 0;
    const c3 = i + 3 < validLen ? b64Lookup[clean[i + 3]] : 0;

    const u24 = (c0 << 18) | (c1 << 12) | (c2 << 6) | c3;

    if (byteIdx < byteLen) bytes[byteIdx++] = (u24 >> 16) & 0xff;
    if (byteIdx < byteLen) bytes[byteIdx++] = (u24 >> 8) & 0xff;
    if (byteIdx < byteLen) bytes[byteIdx++] = u24 & 0xff;
  }

  return bytes;
}

/**
 * Converts a Uint8Array to a URL-safe Base64 string (no padding, - and _).
 */
export function bytesToBase64Url(bytes: Uint8Array): string {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Converts a URL-safe Base64 string to a Uint8Array.
 */
export function base64UrlToBytes(base64url: string): Uint8Array {
  let b64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4 !== 0) {
    b64 += '=';
  }
  return base64ToBytes(b64);
}

/**
 * Encodes a string to a UTF-8 Uint8Array.
 */
export function stringToBytes(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Decodes a UTF-8 Uint8Array to a string.
 */
export function bytesToString(bytes: Uint8Array): string {
  return new TextDecoder().decode(bytes);
}

// --------------------------------------------------------------------------
// CRC-32 (IEEE 802.3) - Portable, zero-dependency checksum
// --------------------------------------------------------------------------

const CRC_TABLE = new Int32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c;
}

/**
 * Computes an unsigned 32-bit CRC32 checksum of a string or Uint8Array.
 */
export function crc32(data: string | Uint8Array): number {
  const bytes = typeof data === 'string' ? stringToBytes(data) : data;
  let crc = -1;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

/**
 * Computes the 8-character lowercase hexadecimal CRC32 checksum.
 */
export function crc32Hex(data: string | Uint8Array): string {
  return crc32(data).toString(16).padStart(8, '0');
}
