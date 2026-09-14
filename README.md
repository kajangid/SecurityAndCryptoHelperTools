# @kjangid/security-tools

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](tsconfig.json)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](package.json)
[![Module](https://img.shields.io/badge/Module-ESM%20%7C%20CJS-orange.svg)]()
[![CI Status](https://github.com/kajangid/SecurityAndCryptoHelperTools/actions/workflows/ci.yml/badge.svg)](https://github.com/kajangid/SecurityAndCryptoHelperTools/actions/workflows/ci.yml)
[![NPM Version](https://img.shields.io/npm/v/@kjangid/security-tools.svg)](https://www.npmjs.com/package/@kjangid/security-tools)
[![Tests](https://img.shields.io/badge/Tests-137%20passed-success.svg)](docs/TESTING.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0.0-green.svg)](package.json)
[![Coverage](https://img.shields.io/badge/coverage-100%25%20matrix-brightgreen.svg)](docs/TESTING.md)

Production-grade, zero-runtime-dependency TypeScript/Node.js utility package and standalone CLI toolkit for password analysis, cryptographic operations, secret generation, and security-focused application helpers.

Target Environments: **Node.js (>= 18.0.0)**, **Modern Browsers**, **Deno**, **Bun**, and **Cloudflare Workers**.

---

## Key Features

- **Zero Runtime Dependencies**: Every single cryptographic and security utility is implemented from first principles with zero external runtime dependencies (`dependencies: {}`).
- **Production-Grade Password Analysis**: Accurate Shannon entropy evaluation, detection of sequential characters, keyboard walk patterns (`qwerty`), repeated substrings, common dictionary blacklists, and realistic crack time estimates across 4 threat models.
- **Universal Cryptographic Primitives**: High-performance SHA-family (`SHA-256`, `SHA-384`, `SHA-512`, `SHA-1`, `MD5`) hashing and HMAC digest generation with synchronous execution and asynchronous Web Crypto API parity.
- **Cryptographically Secure Token Generation**: High-entropy token generators including UUID v4 (RFC 4122 compliant), NanoID collision-resistant IDs, 6-digit OTPs / PINs, hex, and base64url tokens using rejection sampling without modulo bias.
- **Prefixed API Keys with Offline Checksums**: Stripe-style prefixed API keys (`sk_live_..._checksum`) featuring embedded CRC32 integrity verification, enabling instant offline corruption and typo detection without database overhead, plus audit log masking.
- **High-Entropy Secrets & Diceware Passphrases**: Secure secret generator (64 to 8192 bits) and Diceware passphrase engine using an embedded 2048-word EFF wordlist (11 bits of entropy per word).
- **Tamper-Proof Signed URLs**: URL signing with canonical query parameter sorting, HMAC-SHA256 signatures, expiration timestamps, and clock skew tolerance for password reset and magic link flows.
- **Timing Side-Channel Protection**: Constant-time comparison (`timingSafeEqual`) to protect critical authentication checks against timing attacks.
- **Prototype Pollution Defenses**: Built-in defenses (`safeRecord()`, `isSafeKey()`, `safeAssign()`) safeguarding against `__proto__`, `constructor`, and `prototype` injection attacks across all parsers and inputs.
- **Standalone Multi-Command CLI**: Unified binary executable (`crypto-tools`) and dedicated binary aliases (`password-strength`, `hash-util`, `token-gen`, `api-key-gen`, `secret-gen`, `link-signer`) with full standard input piping support and standard exit codes.
- **Dual ESM/CommonJS & Granular Subpath Exports**: Full support for root imports and subpath module imports with `"sideEffects": false` for optimal tree-shaking across Node.js (>= 18), Browsers, Deno, Bun, and Cloudflare Workers.
- **Single Source of Truth Versioning**: Automatic build-time version injection from `package.json`, ensuring synchronization across compiled artifacts and `--version` CLI flags.

---

## Features Matrix

| Tool                   | Module                                        | Description                                                      | CLI Command         |
| :--------------------- | :-------------------------------------------- | :--------------------------------------------------------------- | :------------------ |
| **Password Strength**  | `@kjangid/security-tools/password-strength`   | Entropy calculation, pattern detection, blacklist, crack times   | `password-strength` |
| **Cryptographic Hash** | `@kjangid/security-tools/hash`                | SHA-256/384/512, SHA-1, MD5, and HMAC digests (sync & async)     | `hash`              |
| **Token Generator**    | `@kjangid/security-tools/token-generator`     | Hex, Base64URL, Alphanumeric, OTP, UUID v4, and NanoID tokens    | `token`             |
| **API Key Generator**  | `@kjangid/security-tools/api-key-generator`   | Prefixed keys with embedded CRC32 integrity checksums & masking  | `api-key`           |
| **Secret Generator**   | `@kjangid/security-tools/secret-generator`    | High-entropy raw secrets & Diceware passphrases (2048 words)     | `secret`            |
| **Crypto Utils**       | `@kjangid/security-tools/crypto-utils`        | Unbiased integers, Fisher-Yates shuffle, constant-time compare   | `crypto-tools`      |
| **Signed Links**       | `@kjangid/security-tools/link`                | HMAC-signed URLs, tamper detection, expiration & clock tolerance | `link`              |

---

## Installation

```bash
# npm
npm install @kjangid/security-tools

# pnpm
pnpm add @kjangid/security-tools

# yarn
yarn add @kjangid/security-tools

# bun
bun add @kjangid/security-tools
```

To install the standalone CLI globally:

```bash
npm install -g @kjangid/security-tools
```

---

## Quick Start

### Root Import

```typescript
import {
  analyzePassword,
  generateApiKey,
  generateSignedLink,
  VERSION
} from '@kjangid/security-tools';

console.log(`Using Security Toolkit v${VERSION}`);

// 1. Analyze a password
const strength = analyzePassword('CorrectHorseBatteryStaple!2026');
console.log(strength.scoreLabel); // 'very_strong'

// 2. Generate a prefixed API key with checksum
const apiKey = generateApiKey({ prefix: 'sk_live' });
console.log(apiKey.key); // 'sk_live_xK9..._c8a41f'
```

### Granular Subpath Imports (Tree-Shaking)

The package configures `"sideEffects": false` and granular subpaths for zero-overhead tree shaking:

```typescript
import { analyzePassword } from '@kjangid/security-tools/password-strength';
import { hash, hmac } from '@kjangid/security-tools/hash';
import { generateUuid, generateToken } from '@kjangid/security-tools/token-generator';
import { generateApiKey, verifyApiKey, maskApiKey } from '@kjangid/security-tools/api-key-generator';
import { generateSecret, generatePassphrase } from '@kjangid/security-tools/secret-generator';
import { getRandomBytes, randomInt, timingSafeEqual } from '@kjangid/security-tools/crypto-utils';
import { generateSignedLink, verifySignedLink } from '@kjangid/security-tools/link';
import { VERSION } from '@kjangid/security-tools/version';
```

---

## API Reference

### 1. Password Strength Analysis

Analyzes password complexity, detects dictionary words, sequences, keyboard patterns, calculates Shannon entropy, and estimates crack time.

```typescript
import { analyzePassword } from '@kjangid/security-tools/password-strength';

const result = analyzePassword('P@ssw0rd123!', {
  minScore: 3,
  minLength: 10,
  userInputs: ['mycompany', 'john']
});

console.log(result.score);       // 0 - 4
console.log(result.scoreLabel);  // 'very_weak' | 'weak' | 'fair' | 'strong' | 'very_strong'
console.log(result.entropy);     // Entropy in bits (e.g. 74.2)
console.log(result.crackTimes);  // { onlineThrottled, onlineUnthrottled, offlineSlowHash, offlineFastHash }
console.log(result.feedback);    // { warnings: [...], recommendations: [...] }
console.log(result.isValid);     // true/false based on minScore and minLength
```

### 2. Cryptographic Hashing & HMAC

Universal hashing and message authentication supporting SHA-256, SHA-384, SHA-512, SHA-1, and MD5.

```typescript
import {
  hash,
  hashAsync,
  hmac,
  hmacAsync,
  verifyHmac
} from '@kjangid/security-tools/hash';

// Synchronous SHA-256 hash (hex, base64, base64url, or binary)
const digest = hash('secret data', 'SHA-256', 'hex');

// Asynchronous Web Crypto API digest
const asyncDigest = await hashAsync('secret data', 'SHA-256', 'base64url');

// Synchronous HMAC-SHA256
const mac = hmac('secret-key', 'data payload', 'SHA-256', 'hex');

// Constant-time HMAC verification
const isValid = verifyHmac('secret-key', 'data payload', mac as string);
```

### 3. Token Generator

High-entropy, cryptographically secure random token generation.

```typescript
import {
  generateToken,
  generateAlphanumericToken,
  generateNumericToken,
  generateHexToken,
  generateBase64UrlToken,
  generateUuid,
  generateNanoId,
  generateCustomToken
} from '@kjangid/security-tools/token-generator';

const alpha = generateAlphanumericToken(32); // 32 chars [A-Za-z0-9]
const otp = generateNumericToken(6);         // 6-digit PIN e.g. "829410"
const uuid = generateUuid();                 // RFC 4122 v4 UUID
const nid = generateNanoId(21);              // 21-char URL-safe NanoID
const hex = generateHexToken(16);            // 32-char hex token (16 bytes)
const custom = generateCustomToken(10, 'ABCDEF012345');
```

### 4. API Key Generator

Generates high-entropy prefixed keys with offline CRC32 integrity checksums and secure masking.

```typescript
import {
  generateApiKey,
  verifyApiKey,
  parseApiKey,
  maskApiKey
} from '@kjangid/security-tools/api-key-generator';

// 1. Generate key: <prefix>_<secret>_<checksum>
const { key, prefix, secret, checksum } = generateApiKey({
  prefix: 'sk_live',
  byteLength: 24
});
// Result: 'sk_live_xY7..._c8a41f'

// 2. Offline verification without hitting the database
const verification = verifyApiKey(key, { prefix: 'sk_live' });
if (verification.valid) {
  console.log('Key is structurally valid and untampered!');
}

// 3. Mask for audit logs and UI
console.log(maskApiKey(key)); // 'sk_live••••••••a41f'
```

### 5. Secret Generator

Generates high-entropy configuration secrets and Diceware passphrases from a curated 2048-word EFF list.

```typescript
import {
  generateSecret,
  generatePassphrase,
  estimateSecretEntropy
} from '@kjangid/security-tools/secret-generator';

// Raw 256-bit secret (hex, base64, base64url, or binary)
const sec = generateSecret({ bits: 256, format: 'hex' });

// 6-word Diceware Passphrase (66 bits entropy)
const pass = generatePassphrase({
  words: 6,
  separator: '-',
  capitalize: true,
  includeNumber: true
});
// Result: 'Anxiety-Exact-Federal-Cupboard-Tortoise-Kitten-42'

// Shannon entropy estimation
const entropy = estimateSecretEntropy(sec.secret);
console.log(entropy); // { bits: 256, strength: 'very_high' }
```

### 6. Crypto Utils

Safe wrappers around platform-native crypto primitives.

```typescript
import {
  getRandomBytes,
  randomInt,
  randomFloat,
  randomChoice,
  shuffle,
  crc32,
  crc32Hex,
  timingSafeEqual
} from '@kjangid/security-tools/crypto-utils';

// Unbiased cryptographically random integer in [min, max] (no modulo bias)
const diceRoll = randomInt(1, 6);

// Cryptographically secure uniform float in [0, 1) with 53-bit precision
const float = randomFloat();

// Cryptographic Fisher-Yates shuffle
const shuffled = shuffle(['A', 'B', 'C', 'D']);

// Constant-time comparison (prevents timing side-channel attacks)
const equal = timingSafeEqual(secretA, secretB);
```

### 7. Signed Links

Tamper-proof URLs and magic links with HMAC-SHA256 signatures, expiration timestamps, and clock skew tolerance.

```typescript
import {
  generateSignedLink,
  verifySignedLink,
  createPasswordResetLink,
  createMagicLink
} from '@kjangid/security-tools/link';

// Generate signed link with 15-minute expiration
const link = generateSignedLink({
  baseUrl: 'https://app.com/auth/verify',
  secret: 'app-signing-secret',
  expiresIn: '15m',
  params: { userId: 'usr_123', role: 'admin' }
});

// Verify link
const result = verifySignedLink(link.url, 'app-signing-secret');
if (result.valid) {
  console.log('User ID:', result.params.userId);
} else if (result.expired) {
  console.log('Link expired at:', result.expiresAt);
} else if (result.tampered) {
  console.log('Link signature or query parameter was tampered with!');
}
```

---

## Standalone CLI Guide

The toolkit provides a unified binary (`crypto-tools` or `crypto-security-tools`) and dedicated binary aliases:

| Alias               | Command Equivalent              |
| :------------------ | :------------------------------ |
| `password-strength` | `crypto-tools password-strength` |
| `hash-util`         | `crypto-tools hash`              |
| `token-gen`         | `crypto-tools token`             |
| `api-key-gen`       | `crypto-tools api-key`           |
| `secret-gen`        | `crypto-tools secret`            |
| `link-signer`       | `crypto-tools link`              |

### CLI Commands & Examples

```bash
# Version (evaluated first)
crypto-tools --version
crypto-tools -v

# Password strength analysis
crypto-tools password-strength "MyP@ssw0rd!2026"
crypto-tools password-strength "weak" --json

# Standard input piping
echo "my secret" | crypto-tools hash --algo sha256

# Token generation
crypto-tools token --type alphanumeric --length 32
crypto-tools token --type uuid
crypto-tools token --type numeric --length 6

# API Key generation, verification & masking
crypto-tools api-key --prefix sk_live
crypto-tools api-key --verify "sk_live_xK9..._c8a41f"
crypto-tools api-key --mask "sk_live_1234567890abcdef_12345678"

# Secret & Passphrase generation
crypto-tools secret --bits 256 --format hex
crypto-tools secret --passphrase --words 6 --separator "-"

# Signed Links
crypto-tools link --url "https://app.com/reset" --secret "key123" --expires 15m
crypto-tools link --verify "https://app.com/reset?token=...&exp=...&sig=..." --secret "key123"
```

### Exit Codes

| Exit Code | Meaning            | Example Scenario                                                     |
| :-------- | :----------------- | :------------------------------------------------------------------- |
| **`0`**   | Success            | Operation succeeded, password met strength criteria, link verified   |
| **`1`**   | Validation Failure | Password score below minimum threshold, link expired or tampered     |
| **`2`**   | CLI Usage Error    | Missing required options, unrecognized command, malformed parameters |

---

## Release Process & npm Trusted Publishing

This package uses **npm Trusted Publishing (OIDC)** with **GitHub Actions** for completely free, token-less releases and cryptographic build provenance. Never edit the version string in `package.json` manually.

### Automated Release Flow

```
npm version patch|minor|major
           ↓
git push --follow-tags
           ↓
GitHub Tag vX.Y.Z
           ↓
GitHub Actions (.github/workflows/release.yml)
           ↓
lint → test → build → verify tag version
           ↓
npm publish via OIDC (Provenance enabled, no secrets)
           ↓
GitHub Release (Automated release notes)
```

1. **Bump Version Locally**:
   Run one of the following commands to update `package.json` and automatically generate a version commit and Git tag:
   ```bash
   npm version patch   # 1.0.0 -> 1.0.1 (bug fixes)
   npm version minor   # 1.0.0 -> 1.1.0 (backward-compatible features)
   npm version major   # 1.0.0 -> 2.0.0 (breaking changes)
   ```

2. **Push Commit and Tag**:
   ```bash
   git push --follow-tags
   ```

3. **Automated CI/CD Execution**:
   - The push of the `v*` tag triggers [`.github/workflows/release.yml`](.github/workflows/release.yml).
   - The workflow checks out the tagged commit, runs `npm ci`, lints, tests, and builds artifacts.
   - It verifies that the Git tag strictly matches the `package.json` version.
   - It publishes the package to npm using **OIDC Trusted Publishing** (with cryptographic provenance).
   - It creates a GitHub Release with auto-generated release notes.

### One-Time Setup: npm Trusted Publishing

To enable token-less publishing from GitHub Actions to npm:

1. Log in to [npmjs.com](https://www.npmjs.com).
2. Navigate to your package settings (or **Account Settings** ➔ **Publishing Access** for a new package).
3. Click **Add a Trusted Publisher** and choose **GitHub Actions**.
4. Configure the publisher:
   - **Organization or User**: `kajangid`
   - **Repository**: `SecurityAndCryptoHelperTools`
   - **Workflow filename**: `release.yml`
   - **Environment name**: *(leave empty)*
   - **Package Name**: `@kjangid/security-tools`
5. Save the configuration. No `NPM_TOKEN` secret is required!

---

## Automated Scripts

| Script                   | Command                      | Purpose                                                          |
| :----------------------- | :--------------------------- | :--------------------------------------------------------------- |
| `npm run build`          | `tsup`                       | Compiles dual ESM (`.mjs`), CJS (`.cjs`), and DTS bundles        |
| `npm test`               | `vitest run`                 | Runs all 12 test suites across the matrix                        |
| `npm run test:watch`     | `vitest`                     | Runs Vitest in watch mode                                        |
| `npm run test:coverage`  | `vitest run --coverage`      | Generates V8 statement, branch, and function coverage report     |
| `npm run lint`           | `tsc --noEmit`               | Strict TypeScript compiler lint validation                       |
| `npm run typecheck`      | `tsc --noEmit`               | Strict TypeScript type checking                                  |
| `npm run bump:patch`     | `npm version patch`          | Increments patch version (creates commit & Git tag)              |
| `npm run bump:minor`     | `npm version minor`          | Increments minor version (creates commit & Git tag)              |
| `npm run bump:major`     | `npm version major`          | Increments major version (creates commit & Git tag)              |
| `npm run prepublishOnly` | `typecheck && test && build` | Validates types, runs tests, and builds artifacts before publish |
| `npm run publish:dry`    | `npm publish --dry-run`      | Verifies clean packaging without publishing                      |

---

## Documentation Suite

Detailed architecture and deployment specifications are located in [`docs/`](./docs):

- [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) - System architecture, directory layout, and version flow.
- [`docs/INSTALLATION.md`](./docs/INSTALLATION.md) - Package manager setups, bundler configs, and global CLI.
- [`docs/FEATURES.md`](./docs/FEATURES.md) - Exhaustive API signatures, options interfaces, and CLI reference.
- [`docs/LIMITATIONS.md`](./docs/LIMITATIONS.md) - Operational limits, entropy boundaries, and security considerations.
- [`docs/TESTING.md`](./docs/TESTING.md) - Test breakdown matrix and attack vector test cases.
- [`docs/DEPLOYMENT.md`](./docs/DEPLOYMENT.md) - Publishing pipeline, version bumping, and CI/CD workflow.

---

## License

MIT © [Karan Jangid](LICENSE)
