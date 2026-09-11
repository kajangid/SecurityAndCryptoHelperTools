import { describe, it, expect } from 'vitest';
import * as Toolkit from './index.js';

describe('Root entrypoint exports and end-to-end chained workflows', () => {
  it('exports all expected tools, primitives, and VERSION', () => {
    expect(Toolkit.VERSION).toBeDefined();
    expect(typeof Toolkit.VERSION).toBe('string');

    // Security & parser
    expect(Toolkit.safeRecord).toBeTypeOf('function');
    expect(Toolkit.isSafeKey).toBeTypeOf('function');
    expect(Toolkit.safeAssign).toBeTypeOf('function');
    expect(Toolkit.deepFreeze).toBeTypeOf('function');
    expect(Toolkit.timingSafeEqual).toBeTypeOf('function');
    expect(Toolkit.validateLength).toBeTypeOf('function');
    expect(Toolkit.parseDuration).toBeTypeOf('function');
    expect(Toolkit.parseCliArgs).toBeTypeOf('function');

    // Crypto utils
    expect(Toolkit.getRandomBytes).toBeTypeOf('function');
    expect(Toolkit.randomInt).toBeTypeOf('function');
    expect(Toolkit.randomFloat).toBeTypeOf('function');
    expect(Toolkit.randomChoice).toBeTypeOf('function');
    expect(Toolkit.shuffle).toBeTypeOf('function');
    expect(Toolkit.bytesToHex).toBeTypeOf('function');
    expect(Toolkit.hexToBytes).toBeTypeOf('function');
    expect(Toolkit.bytesToBase64).toBeTypeOf('function');
    expect(Toolkit.base64ToBytes).toBeTypeOf('function');
    expect(Toolkit.bytesToBase64Url).toBeTypeOf('function');
    expect(Toolkit.base64UrlToBytes).toBeTypeOf('function');
    expect(Toolkit.stringToBytes).toBeTypeOf('function');
    expect(Toolkit.bytesToString).toBeTypeOf('function');
    expect(Toolkit.crc32).toBeTypeOf('function');
    expect(Toolkit.crc32Hex).toBeTypeOf('function');

    // Password strength
    expect(Toolkit.analyzePassword).toBeTypeOf('function');

    // Hash
    expect(Toolkit.hash).toBeTypeOf('function');
    expect(Toolkit.hashAsync).toBeTypeOf('function');
    expect(Toolkit.hmac).toBeTypeOf('function');
    expect(Toolkit.hmacAsync).toBeTypeOf('function');
    expect(Toolkit.verifyHmac).toBeTypeOf('function');
    expect(Toolkit.verifyHmacAsync).toBeTypeOf('function');

    // Token
    expect(Toolkit.generateToken).toBeTypeOf('function');
    expect(Toolkit.generateAlphanumericToken).toBeTypeOf('function');
    expect(Toolkit.generateNumericToken).toBeTypeOf('function');
    expect(Toolkit.generateHexToken).toBeTypeOf('function');
    expect(Toolkit.generateBase64UrlToken).toBeTypeOf('function');
    expect(Toolkit.generateUuid).toBeTypeOf('function');
    expect(Toolkit.generateNanoId).toBeTypeOf('function');
    expect(Toolkit.generateCustomToken).toBeTypeOf('function');
    expect(Toolkit.validateTokenFormat).toBeTypeOf('function');

    // API Key
    expect(Toolkit.generateApiKey).toBeTypeOf('function');
    expect(Toolkit.verifyApiKey).toBeTypeOf('function');
    expect(Toolkit.parseApiKey).toBeTypeOf('function');
    expect(Toolkit.maskApiKey).toBeTypeOf('function');

    // Secret
    expect(Toolkit.generateSecret).toBeTypeOf('function');
    expect(Toolkit.generatePassphrase).toBeTypeOf('function');
    expect(Toolkit.estimateSecretEntropy).toBeTypeOf('function');

    // Link
    expect(Toolkit.generateSignedLink).toBeTypeOf('function');
    expect(Toolkit.verifySignedLink).toBeTypeOf('function');
    expect(Toolkit.createPasswordResetLink).toBeTypeOf('function');
    expect(Toolkit.createMagicLink).toBeTypeOf('function');
  });

  describe('Chained End-to-End Integration Workflows', () => {
    it('Workflow 1: Secret Generation -> Signed Link -> Verification', () => {
      // 1. Generate high-entropy 256-bit signing key
      const secretResult = Toolkit.generateSecret({ bits: 256, format: 'hex' });
      expect(secretResult.bits).toBe(256);

      // 2. Generate signed authentication URL
      const signedLink = Toolkit.generateSignedLink({
        baseUrl: 'https://auth.company.internal/reset',
        secret: secretResult.secret as string,
        expiresIn: '15m',
        params: { userId: 'usr_8823', tenant: 'production' }
      });

      // 3. Verify link
      const verification = Toolkit.verifySignedLink(signedLink.url, secretResult.secret as string);
      expect(verification.valid).toBe(true);
      expect(verification.params['userId']).toBe('usr_8823');
      expect(verification.params['tenant']).toBe('production');
    });

    it('Workflow 2: API Key Generation -> Parse -> Verify -> Mask', () => {
      // 1. Generate live API key
      const keyResult = Toolkit.generateApiKey({ prefix: 'sk_live', byteLength: 32 });
      expect(keyResult.prefix).toBe('sk_live');

      // 2. Parse API key components
      const parsed = Toolkit.parseApiKey(keyResult.key);
      expect(parsed.prefix).toBe('sk_live');
      expect(parsed.checksum).toBe(keyResult.checksum);

      // 3. Verify key offline
      const verified = Toolkit.verifyApiKey(keyResult.key, { prefix: 'sk_live' });
      expect(verified.valid).toBe(true);

      // 4. Safely mask for logging
      const masked = Toolkit.maskApiKey(keyResult.key);
      expect(masked.startsWith('sk_live')).toBe(true);
      expect(masked).toContain('••••');
    });

    it('Workflow 3: Passphrase Generation -> Password Strength Analysis', () => {
      // 1. Generate a 6-word Diceware passphrase
      const passResult = Toolkit.generatePassphrase({ words: 6, separator: '-' });
      expect(passResult.words).toBe(6);

      // 2. Analyze password strength
      const analysis = Toolkit.analyzePassword(passResult.passphrase);
      expect(analysis.score).toBeGreaterThanOrEqual(3);
      expect(['strong', 'very_strong']).toContain(analysis.scoreLabel);
      expect(analysis.isValid).toBe(true);
    });

    it('Workflow 4: Token Generation -> HMAC Digest -> Verify HMAC', () => {
      // 1. Generate random session token
      const token = Toolkit.generateAlphanumericToken(32);
      const secret = Toolkit.generateHexToken(16);

      // 2. Sign token with HMAC-SHA256
      const digest = Toolkit.hmac(secret, token, 'SHA-256', 'hex') as string;

      // 3. Verify HMAC digest
      const isValid = Toolkit.verifyHmac(secret, token, digest);
      expect(isValid).toBe(true);
    });
  });
});
