/**
 * Common cryptographic and security types across the toolkit.
 */

export type Encoding = 'hex' | 'base64' | 'base64url' | 'utf8' | 'binary';

export type HashAlgorithm = 'SHA-256' | 'SHA-384' | 'SHA-512' | 'SHA-1' | 'MD5';

// Password Strength Types
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

export interface PasswordFeedback {
  warnings: string[];
  recommendations: string[];
}

export interface PasswordAnalysisResult {
  score: PasswordScore;
  scoreLabel: PasswordScoreLabel;
  entropy: number;
  crackTimes: PasswordCrackTime;
  charset: PasswordCharsetAnalysis;
  patterns: PasswordPatternMatch[];
  feedback: PasswordFeedback;
  isValid: boolean;
}

export interface PasswordAnalysisOptions {
  minScore?: PasswordScore;
  minLength?: number;
  userInputs?: string[];
}

// Token Generator Types
export type TokenType =
  | 'hex'
  | 'base64url'
  | 'base64'
  | 'alphanumeric'
  | 'numeric'
  | 'uuid'
  | 'nanoid'
  | 'custom';

export interface TokenOptions {
  type?: TokenType;
  length?: number;
  byteLength?: number;
  prefix?: string;
  suffix?: string;
  customAlphabet?: string;
}

// API Key Generator Types
export interface ApiKeyOptions {
  prefix?: string;
  byteLength?: number;
  delimiter?: string;
  includeChecksum?: boolean;
}

export interface ApiKeyResult {
  key: string;
  prefix: string;
  secret: string;
  checksum: string;
}

export interface ApiKeyVerifyOptions {
  prefix?: string;
  delimiter?: string;
  customSecretLength?: number;
}

export interface ApiKeyVerifyResult {
  valid: boolean;
  prefix: string;
  secret: string;
  checksum: string;
  reason?: string;
}

export interface MaskOptions {
  visiblePrefixChars?: number;
  visibleSuffixChars?: number;
  maskChar?: string;
}

export interface ParsedApiKey {
  raw: string;
  prefix: string;
  secret: string;
  checksum: string;
}

// Secret Generator Types
export type SecretFormat = 'hex' | 'base64' | 'base64url' | 'binary';

export interface SecretOptions {
  bits?: number;
  format?: SecretFormat;
}

export interface SecretResult {
  secret: string | Uint8Array;
  bits: number;
  format: SecretFormat;
  entropy: number;
}

export interface PassphraseOptions {
  words?: number;
  separator?: string;
  capitalize?: boolean;
  includeNumber?: boolean;
}

export interface PassphraseResult {
  passphrase: string;
  words: number;
  entropy: number;
}

// Signed Link Types
export interface SignedLinkOptions {
  baseUrl: string;
  secret: string;
  expiresIn?: string | number;
  params?: Record<string, string | number | boolean>;
  tokenParam?: string;
  expiryParam?: string;
  signatureParam?: string;
}

export interface SignedLinkResult {
  url: string;
  token: string;
  expiresAt: Date;
  signature: string;
}

export interface VerifyLinkOptions {
  tolerance?: number; // Clock skew in milliseconds
  tokenParam?: string;
  expiryParam?: string;
  signatureParam?: string;
}

export interface VerifyLinkResult {
  valid: boolean;
  expired: boolean;
  tampered: boolean;
  reason?: string;
  expiresAt?: Date;
  params: Record<string, string>;
}

// Hash Options
export interface HashOptions {
  algorithm?: HashAlgorithm;
  encoding?: Encoding;
}

export interface HmacOptions {
  algorithm?: HashAlgorithm;
  encoding?: Encoding;
}

export interface HmacVerifyOptions {
  algorithm?: HashAlgorithm;
  encoding?: Encoding;
}
