/**
 * Cryptographically secure token and identifier generation.
 * Generates hex, base64url, alphanumeric, numeric OTPs, UUID v4, and nano IDs.
 */

import { TokenOptions, TokenType } from '../shared/types.js';
import {
  getRandomBytes,
  randomInt,
  bytesToHex,
  bytesToBase64,
  bytesToBase64Url
} from '../crypto-utils/index.js';
import { validateLength } from '../shared/security.js';

const ALPHANUMERIC_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const NUMERIC_CHARS = '0123456789';
const NANOID_CHARS =
  'ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUvz_KqYTJklmnopwxy'; // 64 URL-safe characters

/**
 * Generates a random alphanumeric string of specified length.
 */
export function generateAlphanumericToken(length = 32): string {
  validateLength(length, 1, 10000, 'Length');
  let token = '';
  const len = ALPHANUMERIC_CHARS.length;
  for (let i = 0; i < length; i++) {
    token += ALPHANUMERIC_CHARS[randomInt(0, len - 1)];
  }
  return token;
}

/**
 * Generates a numeric token (OTP / PIN) of specified length.
 */
export function generateNumericToken(length = 6): string {
  validateLength(length, 1, 1000, 'Length');
  let pin = '';
  for (let i = 0; i < length; i++) {
    pin += NUMERIC_CHARS[randomInt(0, 9)];
  }
  return pin;
}

/**
 * Generates a hexadecimal token from random bytes.
 */
export function generateHexToken(byteLength = 32): string {
  validateLength(byteLength, 1, 10000, 'ByteLength');
  return bytesToHex(getRandomBytes(byteLength));
}

/**
 * Generates a URL-safe Base64 token from random bytes.
 */
export function generateBase64UrlToken(byteLength = 32): string {
  validateLength(byteLength, 1, 10000, 'ByteLength');
  return bytesToBase64Url(getRandomBytes(byteLength));
}

/**
 * Generates an RFC 4122 compliant version 4 UUID using cryptographic randomness.
 */
export function generateUuid(): string {
  const bytes = getRandomBytes(16);

  // Set version to 4: 0100
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  // Set variant to RFC 4122 (10xxxxxx)
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  const hex = bytesToHex(bytes);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

/**
 * Generates a URL-safe collision-resistant NanoID string.
 */
export function generateNanoId(size = 21, alphabet = NANOID_CHARS): string {
  validateLength(size, 1, 1000, 'Size');
  if (alphabet.length < 2) {
    throw new RangeError('Alphabet must contain at least 2 characters.');
  }

  let id = '';
  const len = alphabet.length;
  for (let i = 0; i < size; i++) {
    id += alphabet[randomInt(0, len - 1)];
  }
  return id;
}

/**
 * Generates a token using a custom alphabet.
 */
export function generateCustomToken(length: number, alphabet: string): string {
  validateLength(length, 1, 10000, 'Length');
  if (!alphabet || alphabet.length < 2) {
    throw new RangeError('Alphabet must contain at least 2 distinct characters.');
  }

  let result = '';
  const len = alphabet.length;
  for (let i = 0; i < length; i++) {
    result += alphabet[randomInt(0, len - 1)];
  }
  return result;
}

/**
 * Universal token generation dispatcher with prefix, suffix, and formatting support.
 */
export function generateToken(options: TokenOptions = {}): string {
  const type: TokenType = options.type ?? 'base64url';
  let rawToken: string;

  switch (type) {
    case 'hex': {
      const bytes = options.byteLength ?? (options.length ? Math.ceil(options.length / 2) : 32);
      rawToken = generateHexToken(bytes);
      if (options.length && rawToken.length > options.length) {
        rawToken = rawToken.slice(0, options.length);
      }
      break;
    }
    case 'base64': {
      const bytes = options.byteLength ?? 32;
      rawToken = bytesToBase64(getRandomBytes(bytes));
      if (options.length && rawToken.length > options.length) {
        rawToken = rawToken.slice(0, options.length);
      }
      break;
    }
    case 'base64url': {
      const bytes = options.byteLength ?? 32;
      rawToken = generateBase64UrlToken(bytes);
      if (options.length && rawToken.length > options.length) {
        rawToken = rawToken.slice(0, options.length);
      }
      break;
    }
    case 'alphanumeric':
      rawToken = generateAlphanumericToken(options.length ?? 32);
      break;
    case 'numeric':
      rawToken = generateNumericToken(options.length ?? 6);
      break;
    case 'uuid':
      rawToken = generateUuid();
      break;
    case 'nanoid':
      rawToken = generateNanoId(options.length ?? 21, options.customAlphabet);
      break;
    case 'custom':
      if (!options.customAlphabet) {
        throw new TypeError('customAlphabet is required when token type is "custom".');
      }
      rawToken = generateCustomToken(options.length ?? 32, options.customAlphabet);
      break;
    default:
      throw new RangeError(`Unsupported token type: "${type}".`);
  }

  const prefix = options.prefix ?? '';
  const suffix = options.suffix ?? '';

  return `${prefix}${rawToken}${suffix}`;
}

/**
 * Validates whether a given token matches expected formatting patterns for its type.
 */
export function validateTokenFormat(token: string, type: TokenType): boolean {
  if (typeof token !== 'string' || token.length === 0) return false;

  switch (type) {
    case 'hex':
      return /^[0-9a-fA-F]+$/.test(token) && token.length % 2 === 0;
    case 'numeric':
      return /^[0-9]+$/.test(token);
    case 'alphanumeric':
      return /^[A-Za-z0-9]+$/.test(token);
    case 'uuid':
      return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(token);
    case 'base64':
      return /^[A-Za-z0-9+/]+={0,2}$/.test(token);
    case 'base64url':
    case 'nanoid':
      return /^[A-Za-z0-9_-]+$/.test(token);
    default:
      return true;
  }
}
