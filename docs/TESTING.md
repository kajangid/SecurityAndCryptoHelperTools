# Test Suite Matrix & Verification Strategy

`@kjangid/security-tools` maintains a strict 100% test coverage philosophy. Every single source file in `src/` has its own dedicated, isolated test suite in accordance with mandatory architectural requirements.

---

## Complete Test Matrix

| Test File | Target Module | Test Count | Key Test Focus Areas |
| :--- | :--- | :---: | :--- |
| `src/version.test.ts` | `src/version.ts` | 2 | Package.json single source of truth sync, semver compliance |
| `src/shared/security.test.ts` | `src/shared/security.ts` | 14 | Prototype pollution vectors, `safeRecord`, `deepFreeze`, `timingSafeEqual` |
| `src/shared/parser.test.ts` | `src/shared/parser.ts` | 10 | Duration units (ms/s/m/h/d/w), CLI arguments, flag sanitization |
| `src/crypto-utils/index.test.ts` | `src/crypto-utils/index.ts` | 18 | Unbiased ints, floats, chunking >64KB, Fisher-Yates, Base64/Hex/CRC32 |
| `src/password-strength/index.test.ts` | `src/password-strength/index.ts` | 9 | Common password blacklist, sequences, keyboard patterns, entropy |
| `src/hash/index.test.ts` | `src/hash/index.ts` | 12 | NIST RFC test vectors (SHA-256/384/512), Web Crypto parity, HMAC |
| `src/token-generator/index.test.ts` | `src/token-generator/index.ts` | 11 | UUID v4 RFC 4122 compliance, OTP PINs, collision resistance (500 runs) |
| `src/api-key-generator/index.test.ts` | `src/api-key-generator/index.ts` | 10 | CRC32 checksum embedding, 1-bit tampering detection, masking |
| `src/secret-generator/index.test.ts` | `src/secret-generator/index.ts` | 11 | 2048-word Diceware list, word counts, entropy estimation, bit checks |
| `src/link/index.test.ts` | `src/link/index.ts` | 9 | Tamper detection, signature mismatch, clock skew, expired links |
| `src/bin/cli.test.ts` | `src/bin/cli.ts` | 26 | Subcommands, `--version` priority, stdin piping, binary aliases, exit codes |
| `src/index.test.ts` | `src/index.ts` | 5 | All module re-exports, 4 chained end-to-end integration workflows |
| **Total** | **All 12 Modules** | **137 Tests** | **100% Pass Rate** |

---

## Security Attack Vectors Tested

### 1. Prototype Pollution Defense
- **Attack**: Malicious JSON payloads or CLI flags attempting to pollute Object prototype via `__proto__`, `constructor`, or `prototype`.
- **Verification**: `src/shared/security.test.ts` and `src/shared/parser.test.ts` assert that forbidden keys are stripped and `Object.prototype` remains untouched.

### 2. Timing Side-Channel Resistance
- **Attack**: Measuring string equality comparison latency to deduce secret keys byte by byte.
- **Verification**: `timingSafeEqual()` is tested with identical strings, differing values of the same length, differing length strings, and empty buffers to ensure constant-time behavior.

### 3. API Key & Link Tampering Detection
- **Attack**: Flipping bits in secrets, modifying query parameters, or altering signatures to forge permissions.
- **Verification**:
  - `src/api-key-generator/index.test.ts` verifies that tampering with a single character in the secret or prefix invalidates the key.
  - `src/link/index.test.ts` verifies that modifying even one URL query parameter (e.g. changing `role=user` to `role=admin`) breaks HMAC verification and marks the link as tampered.

---

## Running the Test Suite

```bash
# Run all unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate full V8 coverage report
npm run test:coverage
```
