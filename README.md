# @kjangid/security-tools

[![NPM Version](https://img.shields.io/npm/v/@kjangid/security-tools.svg)](https://www.npmjs.com/package/@kjangid/security-tools)
[![Zero Dependencies](https://img.shields.io/badge/dependencies-0-success.svg)](https://www.npmjs.com/package/@kjangid/security-tools?activeTab=dependencies)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://github.com/kajangid/SecurityAndCryptoHelperTools/blob/master/LICENSE)
[![Tests](https://img.shields.io/badge/Tests-137%20passed-success.svg)](https://github.com/kajangid/SecurityAndCryptoHelperTools/blob/master/docs/TESTING.md)
[![CI](https://github.com/kajangid/SecurityAndCryptoHelperTools/actions/workflows/ci.yml/badge.svg)](https://github.com/kajangid/SecurityAndCryptoHelperTools/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/Node-%3E%3D18.0.0-green.svg)](https://nodejs.org)

Zero-runtime-dependency TypeScript toolkit and multi-command CLI for password strength analysis, cryptographic operations, token/secret generation, and tamper-proof signed links.

Works seamlessly in **Node.js (>= 18)**, **Browsers**, **Deno**, **Bun**, and **Cloudflare Workers**.

---

## Highlights

- **Zero Dependencies**: Pure standard library and platform-native crypto primitives (`dependencies: {}`).
- **Defensive by Default**: Built-in prototype pollution guards and constant-time string comparisons (`timingSafeEqual`).
- **Offline Checksum API Keys**: Stripe-style prefixed keys (`sk_live_..._checksum`) with instant CRC32 integrity validation.
- **Tree-Shakeable Subpaths**: Fully typed dual ESM/CJS bundles with `"sideEffects": false` — import only what you use.
- **Standalone Multi-Command CLI**: Pre-configured unified binary `crypto-tools` with pipe support and dedicated command aliases.

---

## Installation

```bash
npm install @kjangid/security-tools
```

```bash
# Alternative package managers
pnpm add @kjangid/security-tools
yarn add @kjangid/security-tools
bun add @kjangid/security-tools

# Global CLI installation
npm install -g @kjangid/security-tools
```

---

## Quick Start

```typescript
import {
  analyzePassword,
  generateApiKey,
  verifyApiKey,
  generateSignedLink,
  verifySignedLink
} from '@kjangid/security-tools';

// 1. Password Strength Analysis (Shannon entropy + crack times)
const password = analyzePassword('CorrectHorseBatteryStaple!2026', { minScore: 3 });
console.log(password.scoreLabel); // 'very_strong'
console.log(password.crackTimes.offlineSlowHash); // 'centuries'

// 2. Prefixed API Keys with Offline CRC32 Checksums
const { key } = generateApiKey({ prefix: 'sk_live', byteLength: 24 });
console.log(key); // 'sk_live_A8x..._d577b43b'
console.log(verifyApiKey(key, { prefix: 'sk_live' }).valid); // true (verified without DB call)

// 3. Tamper-Proof Signed URLs with Expiration
const link = generateSignedLink({
  baseUrl: 'https://api.example.com/verify',
  secret: 'org-signing-key',
  expiresIn: '15m',
  params: { userId: 'usr_42' }
});

const { valid, params } = verifySignedLink(link.url, 'org-signing-key');
console.log(valid, params.userId); // true 'usr_42'
```

### Tree-Shaking Subpaths

To minimize bundle size in frontend applications, import directly from modular subpaths:

```typescript
import { analyzePassword } from '@kjangid/security-tools/password-strength';
import { hash, hmac, verifyHmac } from '@kjangid/security-tools/hash';
import { generateUuid, generateNumericToken } from '@kjangid/security-tools/token-generator';
import { generateApiKey, maskApiKey } from '@kjangid/security-tools/api-key-generator';
import { generateSecret, generatePassphrase } from '@kjangid/security-tools/secret-generator';
import { generateSignedLink, verifySignedLink } from '@kjangid/security-tools/link';
import { timingSafeEqual, randomInt } from '@kjangid/security-tools/crypto-utils';
```

---

## Core Utilities Matrix

| Module | Subpath Import | What It Does | CLI Command |
| :--- | :--- | :--- | :--- |
| **Password Strength** | `@kjangid/security-tools/password-strength` | Entropy calculation, pattern detection, blacklist, crack times | `password-strength` |
| **Cryptographic Hash** | `@kjangid/security-tools/hash` | SHA-256/384/512, SHA-1, MD5, and HMAC digests (sync & async) | `hash-util` |
| **Token Generator** | `@kjangid/security-tools/token-generator` | Hex, Base64URL, Alphanumeric, OTP PINs, UUID v4, and NanoID | `token-gen` |
| **API Key Generator** | `@kjangid/security-tools/api-key-generator` | Prefixed keys with embedded CRC32 integrity checksums & masking | `api-key-gen` |
| **Secret Generator** | `@kjangid/security-tools/secret-generator` | High-entropy raw secrets & 2048-word Diceware passphrases | `secret-gen` |
| **Crypto Utils** | `@kjangid/security-tools/crypto-utils` | Unbiased integers, Fisher-Yates shuffle, constant-time compare | `crypto-tools` |
| **Signed Links** | `@kjangid/security-tools/link` | HMAC-signed URLs, tamper detection, expiration & clock tolerance | `link-signer` |

---

## CLI Usage

The toolkit exposes a unified command `crypto-tools` (or `crypto-security-tools`) along with direct aliases for every module:

```bash
# Check version or show help
crypto-tools --version
crypto-tools --help

# Password strength analysis (supports JSON output)
password-strength "MyP@ssw0rd!2026"
password-strength "test1234" --json

# Pipe data from standard input to hash
echo "payload data" | hash-util --algo sha256

# Generate tokens & keys
token-gen --type alphanumeric --length 32
token-gen --type uuid
api-key-gen --prefix sk_live

# Generate Diceware passphrases & high-entropy secrets
secret-gen --passphrase --words 6
secret-gen --bits 256 --format hex

# Sign and verify URLs
link-signer --url "https://app.com/reset" --secret "my-secret" --expires 30m
```

---

## Security & Operational Boundaries

- **Secure Randomness**: Requires `globalThis.crypto.getRandomValues`. If unavailable, execution errors out immediately rather than falling back to insecure `Math.random()`.
- **Storage Password Hashing**: `password-strength` scores passwords prior to acceptance; it is **not** a storage hasher. Use Argon2id or bcrypt for database password storage.
- **Legacy Hashes**: MD5 and SHA-1 are included strictly for legacy checksum interop. Never use MD5/SHA-1 for signatures or credentials.

---

## Documentation

- [Complete API Reference & Signatures](https://github.com/kajangid/SecurityAndCryptoHelperTools/blob/master/docs/FEATURES.md)
- [Architecture & Design Decisions](https://github.com/kajangid/SecurityAndCryptoHelperTools/blob/master/docs/ARCHITECTURE.md)
- [Installation & Bundler Setup](https://github.com/kajangid/SecurityAndCryptoHelperTools/blob/master/docs/INSTALLATION.md)
- [Security Limitations & Boundaries](https://github.com/kajangid/SecurityAndCryptoHelperTools/blob/master/docs/LIMITATIONS.md)
- [Test Strategy & Coverage Matrix](https://github.com/kajangid/SecurityAndCryptoHelperTools/blob/master/docs/TESTING.md)
- [CI/CD & Deployment Guide](https://github.com/kajangid/SecurityAndCryptoHelperTools/blob/master/docs/DEPLOYMENT.md)
- [Developer Contributing Guide](https://github.com/kajangid/SecurityAndCryptoHelperTools/blob/master/CONTRIBUTING.md)

---

## License

MIT © [Karan Jangid](https://github.com/kajangid/SecurityAndCryptoHelperTools/blob/master/LICENSE)
