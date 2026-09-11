/**
 * @omnidev-tools/crypto-security-tools
 *
 * Production-grade, zero-runtime-dependency TypeScript/Node.js utility package
 * and standalone CLI toolkit for password analysis, cryptographic operations,
 * secret generation, and security-focused application helpers.
 */

// Package Version (single source of truth)
export { VERSION } from './version.js';

// Universal Primitives & Type Definitions
export * from './shared/types.js';

// Shared Security & Defensive Primitives
export {
  safeRecord,
  isSafeKey,
  hasOwn,
  safeAssign,
  deepFreeze,
  timingSafeEqual,
  validateLength
} from './shared/security.js';

// Shared Argument and Duration Parsing
export {
  parseDuration,
  parseCliArgs
} from './shared/parser.js';

// Platform-Native Cryptographic Wrappers & Byte Encodings
export {
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
  crc32Hex
} from './crypto-utils/index.js';

// Password Strength Analysis & Actionable Guidance
export {
  analyzePassword
} from './password-strength/index.js';

// SHA-Family Hashing & HMAC Generation
export {
  hash,
  hashAsync,
  hmac,
  hmacAsync,
  verifyHmac,
  verifyHmacAsync
} from './hash/index.js';

// Cryptographically Secure Token Generation
export {
  generateToken,
  generateAlphanumericToken,
  generateNumericToken,
  generateHexToken,
  generateBase64UrlToken,
  generateUuid,
  generateNanoId,
  generateCustomToken,
  validateTokenFormat
} from './token-generator/index.js';

// Prefixed API Key Generation & Verification
export {
  generateApiKey,
  verifyApiKey,
  parseApiKey,
  maskApiKey
} from './api-key-generator/index.js';

// High-Entropy Secret & Diceware Passphrase Generation
export {
  generateSecret,
  generatePassphrase,
  estimateSecretEntropy
} from './secret-generator/index.js';

// URL-Safe Signed Links & Expiration Verification
export {
  generateSignedLink,
  verifySignedLink,
  createPasswordResetLink,
  createMagicLink
} from './link/index.js';
