# Operational Boundaries & Security Limitations

While `@omnidev-tools/crypto-security-tools` is engineered for high reliability and defensive safety, engineers should understand its operational and cryptographic boundaries.

---

## 1. Cryptographic Boundaries

### Secure Randomness Requirements
- The toolkit relies on `globalThis.crypto.getRandomValues`. In Node.js (>= 18), modern browsers, Deno, Bun, and Cloudflare Workers, this is provided natively.
- In legacy or non-standard headless environments where `globalThis.crypto` is missing, random generation will intentionally throw an error rather than falling back to non-cryptographic `Math.random()`.

### Hash Algorithm Usage
- `MD5` and `SHA-1` are provided strictly for legacy interoperability and checksum verification against external systems. They must NOT be used for password hashing or security-critical digital signatures due to known collision vulnerabilities.
- For message authentication, always prefer **HMAC-SHA256** or **HMAC-SHA512**.

### Password Storage vs. Strength Analysis
- The `password-strength` module analyzes complexity on the client or API boundary before acceptance.
- It is NOT a password hashing mechanism for storage. Always store accepted passwords using dedicated slow password-hashing functions such as Argon2id or bcrypt.

---

## 2. Memory & Buffer Boundaries

### Web Crypto API 65,536-Byte Quota
- Standard browser `crypto.getRandomValues()` restricts individual buffer allocations to 65,536 bytes (64 KB).
- The `getRandomBytes()` utility automatically segments requests exceeding 65,536 bytes into chunks, supporting buffers up to 100,000,000 bytes.
- However, generating massive in-memory random buffers (> 50 MB) within browser environments is not recommended due to thread memory pressures.

### API Key and Secret Bit Sizes
- Secret generation supports sizes between 64 and 8,192 bits (multiples of 8).
- Passing fractional or non-multiple-of-8 bit counts will throw a `RangeError`.

---

## 3. Clock Skew & Signed Links

### Timestamp Verification Tolerances
- When verifying signed URLs, clock differences between the signing server and verification server can cause premature expiration rejections.
- The `verifySignedLink()` function provides a default tolerance window of **60,000 milliseconds (1 minute)**.
- If your distributed environment experiences greater NTP drift, increase the `tolerance` option:
  ```typescript
  verifySignedLink(url, secret, { tolerance: 120000 }); // 2 minutes
  ```

---

## 4. Prototype Pollution Mitigation

- All argument parsing and query parameter decoding structures use `safeRecord()` (`Object.create(null)`).
- Keys matching `__proto__`, `constructor`, or `prototype` are stripped automatically.
- Passing deeply nested recursive object graphs into untrusted deserializers should still be avoided as a defense-in-depth practice.
