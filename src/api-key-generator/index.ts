/**
 * High-entropy, prefixed API key generation, offline checksum verification,
 * key parsing, and secure masking.
 */

import {
  ApiKeyOptions,
  ApiKeyResult,
  ApiKeyVerifyOptions,
  ApiKeyVerifyResult,
  MaskOptions,
  ParsedApiKey
} from '../shared/types.js';
import {
  crc32Hex,
  timingSafeEqual
} from '../crypto-utils/index.js';
import { generateAlphanumericToken } from '../token-generator/index.js';
import { validateLength } from '../shared/security.js';

/**
 * Computes an offline integrity checksum for a prefix and secret.
 */
function computeChecksum(prefix: string, secret: string, delimiter: string): string {
  return crc32Hex(`${prefix}${delimiter}${secret}`);
}

/**
 * Generates a secure, prefixed API key with embedded checksum.
 */
export function generateApiKey(options: ApiKeyOptions = {}): ApiKeyResult {
  const prefix = options.prefix ?? 'key';
  const byteLength = options.byteLength ?? 24;
  const delimiter = options.delimiter ?? '_';
  const includeChecksum = options.includeChecksum ?? true;

  validateLength(byteLength, 8, 1024, 'ByteLength');

  if (delimiter.length === 0) {
    throw new RangeError('Delimiter cannot be empty.');
  }

  // Generate high-entropy alphanumeric secret (approx 4/3 of byteLength characters)
  const secretCharLength = Math.max(16, Math.round((byteLength * 4) / 3));
  const secret = generateAlphanumericToken(secretCharLength);

  let checksum = '';
  let fullKey = `${prefix}${delimiter}${secret}`;

  if (includeChecksum) {
    checksum = computeChecksum(prefix, secret, delimiter);
    fullKey += `${delimiter}${checksum}`;
  }

  return {
    key: fullKey,
    prefix,
    secret,
    checksum
  };
}

/**
 * Parses an API key into its individual prefix, secret, and checksum components.
 */
export function parseApiKey(key: string, delimiter = '_'): ParsedApiKey {
  if (typeof key !== 'string' || key.trim() === '') {
    throw new TypeError('API key must be a non-empty string.');
  }

  const parts = key.split(delimiter);
  if (parts.length < 2) {
    return {
      raw: key,
      prefix: '',
      secret: key,
      checksum: ''
    };
  }

  if (parts.length === 2) {
    return {
      raw: key,
      prefix: parts[0],
      secret: parts[1],
      checksum: ''
    };
  }

  // Format: prefix_secret_checksum
  const checksum = parts[parts.length - 1];
  const prefix = parts.slice(0, -2).join(delimiter) || parts[0];
  const secret = parts[parts.length - 2];

  return {
    raw: key,
    prefix,
    secret,
    checksum
  };
}

/**
 * Validates an API key against expected prefix, formatting, and offline checksum.
 */
export function verifyApiKey(key: string, options: ApiKeyVerifyOptions = {}): ApiKeyVerifyResult {
  if (typeof key !== 'string' || key.trim() === '') {
    return {
      valid: false,
      prefix: '',
      secret: '',
      checksum: '',
      reason: 'Key must be a non-empty string.'
    };
  }

  const delimiter = options.delimiter ?? '_';
  const parsed = parseApiKey(key, delimiter);

  // Check expected prefix if provided
  if (options.prefix !== undefined && parsed.prefix !== options.prefix) {
    return {
      valid: false,
      prefix: parsed.prefix,
      secret: parsed.secret,
      checksum: parsed.checksum,
      reason: `Prefix mismatch: expected "${options.prefix}", received "${parsed.prefix}".`
    };
  }

  // If key has no checksum, it cannot be validated offline
  if (!parsed.checksum) {
    return {
      valid: false,
      prefix: parsed.prefix,
      secret: parsed.secret,
      checksum: '',
      reason: 'Key does not contain an offline checksum.'
    };
  }

  // Check secret length if specified
  if (options.customSecretLength !== undefined && parsed.secret.length !== options.customSecretLength) {
    return {
      valid: false,
      prefix: parsed.prefix,
      secret: parsed.secret,
      checksum: parsed.checksum,
      reason: `Secret length mismatch: expected ${options.customSecretLength}, received ${parsed.secret.length}.`
    };
  }

  const expectedChecksum = computeChecksum(parsed.prefix, parsed.secret, delimiter);
  const isChecksumValid = timingSafeEqual(parsed.checksum.toLowerCase(), expectedChecksum.toLowerCase());

  if (!isChecksumValid) {
    return {
      valid: false,
      prefix: parsed.prefix,
      secret: parsed.secret,
      checksum: parsed.checksum,
      reason: 'Checksum integrity check failed. The key has been corrupted or tampered with.'
    };
  }

  return {
    valid: true,
    prefix: parsed.prefix,
    secret: parsed.secret,
    checksum: parsed.checksum
  };
}

/**
 * Masks an API key for safe rendering in audit logs, error traces, or administrative UI.
 */
export function maskApiKey(key: string, options: MaskOptions = {}): string {
  if (typeof key !== 'string' || key.length === 0) {
    return '';
  }

  const maskChar = options.maskChar ?? '•';
  const visiblePrefix = options.visiblePrefixChars ?? 7;
  const visibleSuffix = options.visibleSuffixChars ?? 4;

  if (key.length <= visiblePrefix + visibleSuffix) {
    return maskChar.repeat(key.length);
  }

  const start = key.slice(0, visiblePrefix);
  const end = key.slice(key.length - visibleSuffix);
  const maskCount = Math.min(8, key.length - visiblePrefix - visibleSuffix);

  return `${start}${maskChar.repeat(maskCount)}${end}`;
}
