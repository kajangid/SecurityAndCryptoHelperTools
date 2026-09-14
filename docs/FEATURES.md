# Features & API Reference Manual

Exhaustive API documentation, TypeScript function signatures, option interfaces, and practical examples for all utilities in `@kjangid/security-tools`.

---

## 1. Package Version Synchronization

`VERSION` is injected at build and test time from `package.json` (Single Source of Truth).

```typescript
import { VERSION } from '@kjangid/security-tools/version';

console.log(VERSION); // '1.0.0'
```

---

## 2. Password Strength Analysis (`password-strength`)

### `analyzePassword(password: string, options?: PasswordAnalysisOptions): PasswordAnalysisResult`

Evaluates password strength, calculates Shannon entropy, identifies patterns, runs common password dictionary checks, and calculates crack times across 4 attacker profiles.

#### Signatures & Types

```typescript
export type PasswordScore = 0 | 1 | 2 | 3 | 4;
export type PasswordScoreLabel = 'very_weak' | 'weak' | 'fair' | 'strong' | 'very_strong';

export interface PasswordCrackTime {
  onlineThrottled: string;
  onlineUnthrottled: string;
  offlineSlowHash: string;
  offlineFastHash: string;
}

export interface PasswordCharsetAnalysis {
  length: number;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasDigits: boolean;
  hasSymbols: boolean;
  hasUnicode: boolean;
  charsetSize: number;
}

export interface PasswordPatternMatch {
  type: 'sequence' | 'repeat' | 'keyboard' | 'dictionary';
  pattern: string;
  description: string;
}

export interface PasswordAnalysisOptions {
  minScore?: PasswordScore;     // Default: 3
  minLength?: number;           // Default: 8
  userInputs?: string[];        // Personal details to blacklist (username, email, company)
}

export interface PasswordAnalysisResult {
  score: PasswordScore;
  scoreLabel: PasswordScoreLabel;
  entropy: number;
  crackTimes: PasswordCrackTime;
  charset: PasswordCharsetAnalysis;
  patterns: PasswordPatternMatch[];
  feedback: { warnings: string[]; recommendations: string[] };
  isValid: boolean;
}
```

#### Example

```typescript
import { analyzePassword } from '@kjangid/security-tools/password-strength';

const result = analyzePassword('CorrectHorseBatteryStaple!2026', {
  minScore: 3,
  minLength: 12,
  userInputs: ['admin', 'acme']
});

console.log(`Score: ${result.score} (${result.scoreLabel})`);
console.log(`Entropy: ${result.entropy} bits`);
console.log(`Crack time (GPU SHA-256): ${result.crackTimes.offlineFastHash}`);
```

---

## 3. Cryptographic Hashing & HMAC (`hash`)

### Functions

- `hash(data: string | Uint8Array, algorithm?: HashAlgorithm, encoding?: Encoding): string | Uint8Array`
- `hashAsync(data: string | Uint8Array, algorithm?: HashAlgorithm, encoding?: Encoding): Promise<string | Uint8Array>`
- `hmac(key: string | Uint8Array, data: string | Uint8Array, algorithm?: HashAlgorithm, encoding?: Encoding): string | Uint8Array`
- `hmacAsync(key: string | Uint8Array, data: string | Uint8Array, algorithm?: HashAlgorithm, encoding?: Encoding): Promise<string | Uint8Array>`
- `verifyHmac(key: string | Uint8Array, data: string | Uint8Array, expectedHmac: string, options?: HmacVerifyOptions): boolean`
- `verifyHmacAsync(key: string | Uint8Array, data: string | Uint8Array, expectedHmac: string, options?: HmacVerifyOptions): Promise<boolean>`

#### Supported Algorithms & Encodings

- **Algorithms**: `'SHA-256'`, `'SHA-384'`, `'SHA-512'`, `'SHA-1'`, `'MD5'`
- **Encodings**: `'hex'`, `'base64'`, `'base64url'`, `'binary'`

#### Example

```typescript
import { hash, hmac, verifyHmac } from '@kjangid/security-tools/hash';

// Synchronous SHA-256 hex digest
const fileHash = hash('document contents', 'SHA-256', 'hex');

// HMAC generation & verification
const secret = 'signing-key-42';
const signature = hmac(secret, 'event-payload', 'SHA-256', 'base64url') as string;

const isValid = verifyHmac(secret, 'event-payload', signature, { encoding: 'base64url' });
console.log(isValid); // true
```

---

## 4. Token Generator (`token-generator`)

### Functions

- `generateToken(options?: TokenOptions): string`
- `generateAlphanumericToken(length?: number): string`
- `generateNumericToken(length?: number): string`
- `generateHexToken(byteLength?: number): string`
- `generateBase64UrlToken(byteLength?: number): string`
- `generateUuid(): string`
- `generateNanoId(size?: number, alphabet?: string): string`
- `generateCustomToken(length: number, alphabet: string): string`
- `validateTokenFormat(token: string, type: TokenType): boolean`

#### Example

```typescript
import {
  generateToken,
  generateNumericToken,
  generateUuid
} from '@kjangid/security-tools/token-generator';

// 6-digit OTP code for 2FA SMS
const otp = generateNumericToken(6);

// Standard RFC 4122 v4 UUID
const transactionId = generateUuid();

// Custom prefixed authentication token
const token = generateToken({
  type: 'alphanumeric',
  length: 32,
  prefix: 'sess_'
});
```

---

## 5. API Key Generator (`api-key-generator`)

### Functions

- `generateApiKey(options?: ApiKeyOptions): ApiKeyResult`
- `verifyApiKey(key: string, options?: ApiKeyVerifyOptions): ApiKeyVerifyResult`
- `parseApiKey(key: string, delimiter?: string): ParsedApiKey`
- `maskApiKey(key: string, options?: MaskOptions): string`

#### Key Structure

Format: `${prefix}${delimiter}${secret}${delimiter}${checksum}`
- `prefix`: e.g. `sk_live`, `pk_test`
- `secret`: High-entropy alphanumeric string
- `checksum`: 8-character CRC32 hex checksum computed over prefix + secret

#### Example

```typescript
import {
  generateApiKey,
  verifyApiKey,
  maskApiKey
} from '@kjangid/security-tools/api-key-generator';

// 1. Generate key
const { key, prefix, checksum } = generateApiKey({ prefix: 'sk_live', byteLength: 32 });
console.log(key); // 'sk_live_xY7Abc123..._c8a41f'

// 2. Offline validation (fast reject on typos without database queries)
const check = verifyApiKey(key, { prefix: 'sk_live' });
if (check.valid) {
  // Query database for hash of key.secret
}

// 3. Mask for audit trail logs
console.log(maskApiKey(key)); // 'sk_live••••••••a41f'
```

---

## 6. Secret & Passphrase Generator (`secret-generator`)

### Functions

- `generateSecret(options?: SecretOptions): SecretResult`
- `generatePassphrase(options?: PassphraseOptions): PassphraseResult`
- `estimateSecretEntropy(secret: string | Uint8Array): { bits: number; strength: string }`

#### Example

```typescript
import {
  generateSecret,
  generatePassphrase
} from '@kjangid/security-tools/secret-generator';

// Generate raw 256-bit AES encryption key
const aesKey = generateSecret({ bits: 256, format: 'hex' });

// Generate 6-word Diceware passphrase (66 bits entropy)
const masterPass = generatePassphrase({
  words: 6,
  separator: '-',
  capitalize: true,
  includeNumber: true
});
console.log(masterPass.passphrase);
// 'Anxiety-Exact-Federal-Cupboard-Tortoise-Kitten-92'
```

---

## 7. Platform Crypto Utilities (`crypto-utils`)

### Functions

- `getRandomBytes(size: number): Uint8Array`
- `randomInt(min: number, max: number): number` (unbiased rejection sampling)
- `randomFloat(): number` (53-bit precision in `[0, 1)`)
- `randomChoice<T>(array: readonly T[]): T`
- `shuffle<T>(array: readonly T[]): T[]`
- `bytesToHex(bytes: Uint8Array): string`
- `hexToBytes(hex: string): Uint8Array`
- `bytesToBase64(bytes: Uint8Array): string`
- `base64ToBytes(base64: string): Uint8Array`
- `bytesToBase64Url(bytes: Uint8Array): string`
- `base64UrlToBytes(base64url: string): Uint8Array`
- `crc32(data: string | Uint8Array): number`
- `crc32Hex(data: string | Uint8Array): string`
- `timingSafeEqual(a: string | Uint8Array, b: string | Uint8Array): boolean`

---

## 8. Signed Links (`link`)

### Functions

- `generateSignedLink(options: SignedLinkOptions): SignedLinkResult`
- `verifySignedLink(urlOrQuery: string, secret: string, options?: VerifyLinkOptions): VerifyLinkResult`
- `createPasswordResetLink(baseUrl: string, secret: string, userId: string, expiresIn?: string | number): SignedLinkResult`
- `createMagicLink(baseUrl: string, secret: string, email: string, expiresIn?: string | number): SignedLinkResult`

#### Example

```typescript
import {
  createPasswordResetLink,
  verifySignedLink
} from '@kjangid/security-tools/link';

const signingKey = 'org-signing-secret';

// Generate reset link valid for 20 minutes
const resetLink = createPasswordResetLink(
  'https://auth.company.com/reset-password',
  signingKey,
  'usr_9981',
  '20m'
);

// Verify when user clicks the email link
const verification = verifySignedLink(resetLink.url, signingKey);
if (verification.valid) {
  console.log('Allow password reset for:', verification.params.userId);
} else if (verification.expired) {
  console.log('Reset link expired.');
} else {
  console.log('Invalid or tampered link.');
}
```
