/**
 * Tamper-proof signed URL and magic link generation and verification.
 * Includes expiration, canonicalized HMAC-SHA256 signatures, and clock skew tolerance.
 */

import {
  SignedLinkOptions,
  SignedLinkResult,
  VerifyLinkOptions,
  VerifyLinkResult
} from '../shared/types.js';
import { generateBase64UrlToken } from '../token-generator/index.js';
import { hmac, verifyHmac } from '../hash/index.js';
import { parseDuration } from '../shared/parser.js';
import { safeRecord, isSafeKey } from '../shared/security.js';

/**
 * Normalizes and canonicalizes URL query parameters for deterministic HMAC signing.
 */
function canonicalizeParams(
  params: URLSearchParams,
  signatureParam: string
): string {
  const entries: [string, string][] = [];

  for (const [key, val] of params.entries()) {
    if (key !== signatureParam && isSafeKey(key)) {
      entries.push([key, val]);
    }
  }

  // Sort parameters alphabetically by key, then value
  entries.sort(([k1, v1], [k2, v2]) => {
    if (k1 === k2) return v1.localeCompare(v2);
    return k1.localeCompare(k2);
  });

  return entries
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&');
}

/**
 * Generates a tamper-proof URL with embedded HMAC signature and optional expiration.
 */
export function generateSignedLink(options: SignedLinkOptions): SignedLinkResult {
  const { baseUrl, secret } = options;

  if (typeof baseUrl !== 'string' || baseUrl.trim() === '') {
    throw new TypeError('baseUrl must be a non-empty string.');
  }
  if (typeof secret !== 'string' || secret.trim() === '') {
    throw new TypeError('secret must be a non-empty string.');
  }

  const tokenParam = options.tokenParam ?? 'token';
  const expiryParam = options.expiryParam ?? 'exp';
  const signatureParam = options.signatureParam ?? 'sig';

  // Support absolute or relative URLs by providing a dummy origin if necessary
  const isRelative = !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://');
  const dummyOrigin = 'https://test.local';
  const urlObj = new URL(baseUrl, isRelative ? dummyOrigin : undefined);

  // 1. Add custom parameters
  if (options.params) {
    for (const [k, v] of Object.entries(options.params)) {
      if (isSafeKey(k) && v !== undefined && v !== null) {
        urlObj.searchParams.set(k, String(v));
      }
    }
  }

  // 2. Generate and set unique random token
  const token = generateBase64UrlToken(24);
  urlObj.searchParams.set(tokenParam, token);

  // 3. Set expiration timestamp
  let expiresAt: Date;
  if (options.expiresIn !== undefined) {
    const durationMs = parseDuration(options.expiresIn);
    expiresAt = new Date(Date.now() + durationMs);
    urlObj.searchParams.set(expiryParam, Math.floor(expiresAt.getTime() / 1000).toString());
  } else {
    // Default 1 hour if not specified
    expiresAt = new Date(Date.now() + 3600 * 1000);
    urlObj.searchParams.set(expiryParam, Math.floor(expiresAt.getTime() / 1000).toString());
  }

  // 4. Compute canonical string over path + sorted query parameters
  const canonicalQuery = canonicalizeParams(urlObj.searchParams, signatureParam);
  const signaturePayload = `${urlObj.pathname}?${canonicalQuery}`;

  // 5. Compute HMAC-SHA256 signature in URL-safe base64
  const signature = hmac(secret, signaturePayload, 'SHA-256', 'base64url') as string;
  urlObj.searchParams.set(signatureParam, signature);

  const finalUrl = isRelative
    ? `${urlObj.pathname}${urlObj.search}${urlObj.hash}`
    : urlObj.toString();

  return {
    url: finalUrl,
    token,
    expiresAt,
    signature
  };
}

/**
 * Validates a signed link against secret, HMAC signature, and expiration timestamp.
 */
export function verifySignedLink(
  urlOrQuery: string,
  secret: string,
  options: VerifyLinkOptions = {}
): VerifyLinkResult {
  const result: VerifyLinkResult = {
    valid: false,
    expired: false,
    tampered: false,
    params: safeRecord<string>()
  };

  if (typeof urlOrQuery !== 'string' || urlOrQuery.trim() === '') {
    result.reason = 'URL or query string must be non-empty.';
    return result;
  }
  if (typeof secret !== 'string' || secret.trim() === '') {
    result.reason = 'Secret key must be provided.';
    return result;
  }

  const tokenParam = options.tokenParam ?? 'token';
  const expiryParam = options.expiryParam ?? 'exp';
  const signatureParam = options.signatureParam ?? 'sig';
  const toleranceMs = options.tolerance ?? 60000; // 1 minute default clock skew allowance

  const dummyOrigin = "https://test.local";
  let urlObj: URL;
  try {
    const isRelative = !urlOrQuery.startsWith('http://') && !urlOrQuery.startsWith('https://');
    urlObj = new URL(urlOrQuery, isRelative ? dummyOrigin : undefined);
  } catch {
    result.reason = 'Invalid URL format.';
    return result;
  }

  const signature = urlObj.searchParams.get(signatureParam);
  if (!signature) {
    result.tampered = true;
    result.reason = `Missing required signature parameter "${signatureParam}".`;
    return result;
  }

  const token = urlObj.searchParams.get(tokenParam);
  if (!token) {
    result.tampered = true;
    result.reason = `Missing required token parameter "${tokenParam}".`;
    return result;
  }

  // Populate safe params record
  for (const [k, v] of urlObj.searchParams.entries()) {
    if (isSafeKey(k)) {
      result.params[k] = v;
    }
  }

  // 1. Verify HMAC Signature
  const canonicalQuery = canonicalizeParams(urlObj.searchParams, signatureParam);
  const signaturePayload = `${urlObj.pathname}?${canonicalQuery}`;

  const isSignatureValid = verifyHmac(secret, signaturePayload, signature, {
    algorithm: 'SHA-256',
    encoding: 'base64url'
  });

  if (!isSignatureValid) {
    result.tampered = true;
    result.reason = 'Invalid signature: Link has been tampered with or secret is incorrect.';
    return result;
  }

  // 2. Verify Expiration
  const expStr = urlObj.searchParams.get(expiryParam);
  if (expStr) {
    const expSec = parseInt(expStr, 10);
    if (isNaN(expSec)) {
      result.tampered = true;
      result.reason = 'Malformed expiration timestamp.';
      return result;
    }

    const expTime = expSec * 1000;
    result.expiresAt = new Date(expTime);

    if (Date.now() > expTime + toleranceMs) {
      result.expired = true;
      result.reason = 'Link has expired.';
      return result;
    }
  }

  result.valid = true;
  return result;
}

/**
 * Helper to generate a password reset link.
 */
export function createPasswordResetLink(
  baseUrl: string,
  secret: string,
  userId: string,
  expiresIn = '15m'
): SignedLinkResult {
  return generateSignedLink({
    baseUrl,
    secret,
    expiresIn,
    params: { userId, action: 'password_reset' }
  });
}

/**
 * Helper to generate an authentication magic link.
 */
export function createMagicLink(
  baseUrl: string,
  secret: string,
  email: string,
  expiresIn = '10m'
): SignedLinkResult {
  return generateSignedLink({
    baseUrl,
    secret,
    expiresIn,
    params: { email, action: 'magic_login' }
  });
}
