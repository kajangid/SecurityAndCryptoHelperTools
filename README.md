# @omnidev-tools/crypto-security-tools

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](tsconfig.json)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](package.json)
[![Module](https://img.shields.io/badge/Module-ESM%20%7C%20CJS-orange.svg)]()

<!-- [![CI Status](https://img.shields.io/badge/CI-Passing-brightgreen.svg)]() -->

[![NPM Version](https://img.shields.io/npm/v/@omnidev-tools/crypto-security-tools.svg)](https://www.npmjs.com/package/@omnidev-tools/crypto-security-tools)
[![Tests](https://img.shields.io/badge/Tests-137%20passed-success.svg)](docs/TESTING.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0.0-green.svg)](package.json)
[![Coverage](https://img.shields.io/badge/coverage-100%25%20matrix-brightgreen.svg)](docs/TESTING.md)
[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)]()

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

| Tool                   | Module                                                   | Description                                                      | CLI Command         |
| :--------------------- | :------------------------------------------------------- | :--------------------------------------------------------------- | :------------------ |
| **Password Strength**  | `@omnidev-tools/crypto-security-tools/password-strength` | Entropy calculation, pattern detection, blacklist, crack times   | `password-strength` |
| **Cryptographic Hash** | `@omnidev-tools/crypto-security-tools/hash`              | SHA-256/384/512, SHA-1, MD5, and HMAC digests (sync & async)     | `hash`              |
| **Token Generator**    | `@omnidev-tools/crypto-security-tools/token-generator`   | Hex, Base64URL, Alphanumeric, OTP, UUID v4, and NanoID tokens    | `token`             |
| **API Key Generator**  | `@omnidev-tools/crypto-security-tools/api-key-generator` | Prefixed keys with embedded CRC32 integrity checksums & masking  | `api-key`           |
| **Secret Generator**   | `@omnidev-tools/crypto-security-tools/secret-generator`  | High-entropy raw secrets & Diceware passphrases (2048 words)     | `secret`            |
| **Crypto Utils**       | `@omnidev-tools/crypto-security-tools/crypto-utils`      | Unbiased integers, Fisher-Yates shuffle, constant-time compare   | `crypto-tools`      |
| **Signed Links**       | `@omnidev-tools/crypto-security-tools/link`              | HMAC-signed URLs, tamper detection, expiration & clock tolerance | `link`              |

---

## Installation

```bash
# npm
npm install @omnidev-tools/crypto-security-tools

# pnpm
pnpm add @omnidev-tools/crypto-security-tools

# yarn
yarn add @omnidev-tools/crypto-security-tools

# bun
bun add @omnidev-tools/crypto-security-tools
```

To install the standalone CLI globally:

```bash
npm install -g @omnidev-tools/crypto-security-tools
```

---

## Quick Start

### Root Import

```typescript
import { analyzePassword, generateApiKey, generateSignedLink, VERSION } from "@omnidev-tools/crypto-security-tools";

console.log(`Using Security Toolkit v${VERSION}`);

// 1. Analyze a password
const strength = analyzePassword("CorrectHorseBatteryStaple!2026");
console.log(strength.scoreLabel); // 'very_strong'

// 2. Generate a prefixed API key with checksum
const apiKey = generateApiKey({ prefix: "sk_live" });
console.log(apiKey.key); // 'sk_live_xK9..._c8a41f'
```

### Granular Subpath Imports (Tree-Shaking)

The package configures `"sideEffects": false` and granular subpaths for zero-overhead tree shaking:

```typescript
import { analyzePassword } from "@omnidev-tools/crypto-security-tools/password-strength";
import { hash, hmac } from "@omnidev-tools/crypto-security-tools/hash";
import { generateUuid, generateToken } from "@omnidev-tools/crypto-security-tools/token-generator";
import { generateApiKey, verifyApiKey, maskApiKey } from "@omnidev-tools/crypto-security-tools/api-key-generator";
import { generateSecret, generatePassphrase } from "@omnidev-tools/crypto-security-tools/secret-generator";
import { getRandomBytes, randomInt, timingSafeEqual } from "@omnidev-tools/crypto-security-tools/crypto-utils";
import { generateSignedLink, verifySignedLink } from "@omnidev-tools/crypto-security-tools/link";
import { VERSION } from "@omnidev-tools/crypto-security-tools/version";
```

---

## API Reference

### 1. Password Strength Analysis

Analyzes password complexity, detects dictionary words, sequences, keyboard patterns, calculates Shannon entropy, and estimates crack time.

```typescript
import { analyzePassword } from "@omnidev-tools/crypto-security-tools/password-strength";

const result = analyzePassword("P@ssw0rd123!", {
  minScore: 3,
  minLength: 10,
  userInputs: ["mycompany", "john"],
});

console.log(result.score); // 0 - 4
console.log(result.scoreLabel); // 'very_weak' | 'weak' | 'fair' | 'strong' | 'very_strong'
console.log(result.entropy); // Entropy in bits (e.g. 74.2)
console.log(result.crackTimes); // { onlineThrottled, onlineUnthrottled, offlineSlowHash, offlineFastHash }
console.log(result.feedback); // { warnings: [...], recommendations: [...] }
console.log(result.isValid); // true/false based on minScore and minLength
```

### 2. Cryptographic Hashing & HMAC

Universal hashing and message authentication supporting SHA-256, SHA-384, SHA-512, SHA-1, and MD5.

```typescript
import { hash, hashAsync, hmac, hmacAsync, verifyHmac } from "@omnidev-tools/crypto-security-tools/hash";

// Synchronous SHA-256 hash (hex, base64, base64url, or binary)
const digest = hash("secret data", "SHA-256", "hex");

// Asynchronous Web Crypto API digest
const asyncDigest = await hashAsync("secret data", "SHA-256", "base64url");

// Synchronous HMAC-SHA256
const mac = hmac("secret-key", "data payload", "SHA-256", "hex");

// Constant-time HMAC verification
const isValid = verifyHmac("secret-key", "data payload", mac as string);
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
  generateCustomToken,
} from "@omnidev-tools/crypto-security-tools/token-generator";

const alpha = generateAlphanumericToken(32); // 32 chars [A-Za-z0-9]
const otp = generateNumericToken(6); // 6-digit PIN e.g. "829410"
const uuid = generateUuid(); // RFC 4122 v4 UUID
const nid = generateNanoId(21); // 21-char URL-safe NanoID
const hex = generateHexToken(16); // 32-char hex token (16 bytes)
const custom = generateCustomToken(10, "ABCDEF012345");
```

### 4. API Key Generator

Generates high-entropy prefixed keys with offline CRC32 integrity checksums and secure masking.

```typescript
import {
  generateApiKey,
  verifyApiKey,
  parseApiKey,
  maskApiKey,
} from "@omnidev-tools/crypto-security-tools/api-key-generator";

// 1. Generate key: <prefix>_<secret>_<checksum>
const { key, prefix, secret, checksum } = generateApiKey({
  prefix: "sk_live",
  byteLength: 24,
});
// Result: 'sk_live_xY7..._c8a41f'

// 2. Offline verification without hitting the database
const verification = verifyApiKey(key, { prefix: "sk_live" });
if (verification.valid) {
  console.log("Key is structurally valid and untampered!");
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
  estimateSecretEntropy,
} from "@omnidev-tools/crypto-security-tools/secret-generator";

// Raw 256-bit secret (hex, base64, base64url, or binary)
const sec = generateSecret({ bits: 256, format: "hex" });

// 6-word Diceware Passphrase (66 bits entropy)
const pass = generatePassphrase({
  words: 6,
  separator: "-",
  capitalize: true,
  includeNumber: true,
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
  timingSafeEqual,
} from "@omnidev-tools/crypto-security-tools/crypto-utils";

// Unbiased cryptographically random integer in [min, max] (no modulo bias)
const diceRoll = randomInt(1, 6);

// Cryptographically secure uniform float in [0, 1) with 53-bit precision
const float = randomFloat();

// Cryptographic Fisher-Yates shuffle
const shuffled = shuffle(["A", "B", "C", "D"]);

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
  createMagicLink,
} from "@omnidev-tools/crypto-security-tools/link";

// Generate signed link with 15-minute expiration
const link = generateSignedLink({
  baseUrl: "https://app.com/auth/verify",
  secret: "app-signing-secret",
  expiresIn: "15m",
  params: { userId: "usr_123", role: "admin" },
});

// Verify link
const result = verifySignedLink(link.url, "app-signing-secret");
if (result.valid) {
  console.log("User ID:", result.params.userId);
} else if (result.expired) {
  console.log("Link expired at:", result.expiresAt);
} else if (result.tampered) {
  console.log("Link signature or query parameter was tampered with!");
}
```

---

## Standalone CLI Guide

The toolkit provides a unified binary (`crypto-tools` or `crypto-security-tools`) and dedicated binary aliases:

| Alias               | Command Equivalent               |
| :------------------ | :------------------------------- |
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

## Automated Scripts

| Script                   | Command                      | Purpose                                                          |
| :----------------------- | :--------------------------- | :--------------------------------------------------------------- |
| `npm run build`          | `tsup`                       | Compiles dual ESM (`.mjs`), CJS (`.cjs`), and DTS bundles        |
| `npm test`               | `vitest run`                 | Runs all 12 test suites across the matrix                        |
| `npm run test:coverage`  | `vitest run --coverage`      | Generates V8 statement, branch, and function coverage report     |
| `npm run typecheck`      | `tsc --noEmit`               | Strict TypeScript compiler validation                            |
| `npm run bump:patch`     | `npm version patch`          | Increments patch version (Single Source of Truth)                |
| `npm run bump:minor`     | `npm version minor`          | Increments minor version                                         |
| `npm run bump:major`     | `npm version major`          | Increments major version                                         |
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

MIT © [OmniDev Tools](LICENSE)
