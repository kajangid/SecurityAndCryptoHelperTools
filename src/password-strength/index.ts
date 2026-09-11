/**
 * Password strength analysis, entropy calculation, pattern detection,
 * crack time estimation, and actionable security feedback.
 */

import {
  PasswordScore,
  PasswordScoreLabel,
  PasswordAnalysisResult,
  PasswordAnalysisOptions,
  PasswordCharsetAnalysis,
  PasswordPatternMatch,
  PasswordCrackTime
} from '../shared/types.js';

// Top common passwords blacklist for instant identification
const COMMON_PASSWORDS = new Set([
  '123456',
  'password',
  '123456789',
  '12345678',
  '12345',
  '111111',
  '1234567',
  'sunshine',
  'qwerty',
  'iloveyou',
  'princess',
  'admin',
  'welcome',
  'football',
  'monkey',
  'charlie',
  'donald',
  'dragon',
  'baseball',
  'shadow',
  'master',
  'michael',
  'superman',
  'secret',
  'trustno1',
  'letmein',
  'computer',
  'pass123',
  'password1',
  'password123',
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
  'hunter2'
]);

// Keyboard rows for pattern detection
const KEYBOARD_ROWS = [
  'qwertyuiop',
  'asdfghjkl',
  'zxcvbnm',
  '1234567890'
];

/**
 * Analyzes the character set composition of a password.
 */
function analyzeCharset(password: string): PasswordCharsetAnalysis {
  const codePoints = Array.from(password);
  let hasLowercase = false;
  let hasUppercase = false;
  let hasDigits = false;
  let hasSymbols = false;
  let hasUnicode = false;

  for (const char of codePoints) {
    const code = char.codePointAt(0) ?? 0;

    if (code >= 97 && code <= 122) {
      hasLowercase = true;
    } else if (code >= 65 && code <= 90) {
      hasUppercase = true;
    } else if (code >= 48 && code <= 57) {
      hasDigits = true;
    } else if (code <= 127) {
      hasSymbols = true;
    } else {
      hasUnicode = true;
    }
  }

  let charsetSize = 0;
  if (hasLowercase) charsetSize += 26;
  if (hasUppercase) charsetSize += 26;
  if (hasDigits) charsetSize += 10;
  if (hasSymbols) charsetSize += 33;
  if (hasUnicode) charsetSize += 100;

  return {
    length: codePoints.length,
    hasLowercase,
    hasUppercase,
    hasDigits,
    hasSymbols,
    hasUnicode,
    charsetSize
  };
}

/**
 * Detects common patterns including repeats, sequential runs, keyboard patterns, and blacklisted words.
 */
function detectPatterns(password: string, userInputs: string[] = []): PasswordPatternMatch[] {
  const patterns: PasswordPatternMatch[] = [];
  const lower = password.toLowerCase();

  // 1. Common password dictionary check
  if (COMMON_PASSWORDS.has(lower)) {
    patterns.push({
      type: 'dictionary',
      pattern: password,
      description: 'Matches one of the most commonly used passwords.'
    });
  }

  // 2. User inputs check
  for (const input of userInputs) {
    if (input && input.length >= 3 && lower.includes(input.toLowerCase())) {
      patterns.push({
        type: 'dictionary',
        pattern: input,
        description: `Contains personal or context-specific term "${input}".`
      });
    }
  }

  // 3. Repeated characters (e.g., 'aaaa' or '1111')
  const repeatMatch = password.match(/(.)\1{2,}/g);
  if (repeatMatch) {
    for (const match of repeatMatch) {
      patterns.push({
        type: 'repeat',
        pattern: match,
        description: `Contains repeated character sequence "${match}".`
      });
    }
  }

  // 4. Sequential alphabetical or numerical sequences
  for (let i = 0; i < password.length - 2; i++) {
    const c1 = password.charCodeAt(i);
    const c2 = password.charCodeAt(i + 1);
    const c3 = password.charCodeAt(i + 2);

    if ((c2 === c1 + 1 && c3 === c2 + 1) || (c2 === c1 - 1 && c3 === c2 - 1)) {
      const seq = password.slice(i, i + 3);
      patterns.push({
        type: 'sequence',
        pattern: seq,
        description: `Contains sequential characters "${seq}".`
      });
      break; // Record once
    }
  }

  // 5. Keyboard spatial patterns
  for (const row of KEYBOARD_ROWS) {
    for (let i = 0; i <= row.length - 3; i++) {
      const forward = row.slice(i, i + 3);
      const reverse = forward.split('').reverse().join('');
      if (lower.includes(forward) || lower.includes(reverse)) {
        patterns.push({
          type: 'keyboard',
          pattern: forward,
          description: `Contains keyboard row sequence "${forward}".`
        });
        break;
      }
    }
  }

  return patterns;
}

/**
 * Calculates adjusted entropy (in bits) factoring in charset diversity and pattern penalties.
 */
function calculateEntropy(charset: PasswordCharsetAnalysis, patterns: PasswordPatternMatch[]): number {
  if (charset.length === 0 || charset.charsetSize === 0) {
    return 0;
  }

  // Base Shannon-style entropy: L * log2(R)
  const baseEntropy = charset.length * Math.log2(charset.charsetSize);

  let penalty = 0;
  for (const p of patterns) {
    if (p.type === 'dictionary') penalty += 30;
    if (p.type === 'repeat') penalty += p.pattern.length * 3;
    if (p.type === 'sequence') penalty += 10;
    if (p.type === 'keyboard') penalty += 12;
  }

  const effectiveEntropy = Math.max(0, baseEntropy - penalty);
  return Math.round(effectiveEntropy * 10) / 10;
}

/**
 * Formats seconds into human-readable duration strings.
 */
function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 1) {
    return '< 1 second';
  }
  if (seconds < 60) {
    return `${Math.round(seconds)} seconds`;
  }
  const minutes = seconds / 60;
  if (minutes < 60) {
    return `${Math.round(minutes)} minutes`;
  }
  const hours = minutes / 60;
  if (hours < 24) {
    return `${Math.round(hours)} hours`;
  }
  const days = hours / 24;
  if (days < 30) {
    return `${Math.round(days)} days`;
  }
  const months = days / 30.44;
  if (months < 12) {
    return `${Math.round(months)} months`;
  }
  const years = days / 365.25;
  if (years < 1000) {
    return `${Math.round(years)} years`;
  }
  if (years < 1000000) {
    return `${Math.round(years / 1000)} millennia`;
  }
  return 'centuries';
}

/**
 * Computes crack times against 4 attacker profiles.
 */
function computeCrackTimes(entropy: number): PasswordCrackTime {
  // Number of guesses to crack is roughly 2^(entropy - 1) on average
  const guesses = Math.pow(2, Math.min(entropy, 128));

  const onlineThrottledSec = guesses / 10; // 10 guesses/sec
  const onlineUnthrottledSec = guesses / 100; // 100 guesses/sec
  const offlineSlowHashSec = guesses / 10000; // 10,000 guesses/sec (bcrypt/argon2)
  const offlineFastHashSec = guesses / 10000000000; // 10 billion guesses/sec (GPU SHA-256)

  return {
    onlineThrottled: formatSeconds(onlineThrottledSec),
    onlineUnthrottled: formatSeconds(onlineUnthrottledSec),
    offlineSlowHash: formatSeconds(offlineSlowHashSec),
    offlineFastHash: formatSeconds(offlineFastHashSec)
  };
}

/**
 * Derives a score from 0 (very_weak) to 4 (very_strong).
 */
function deriveScore(
  charset: PasswordCharsetAnalysis,
  entropy: number,
  patterns: PasswordPatternMatch[]
): { score: PasswordScore; scoreLabel: PasswordScoreLabel } {
  if (charset.length === 0) {
    return { score: 0, scoreLabel: 'very_weak' };
  }

  const hasDictionary = patterns.some((p) => p.type === 'dictionary');
  if (hasDictionary || charset.length < 6 || entropy < 25) {
    return { score: 0, scoreLabel: 'very_weak' };
  }

  if (charset.length < 8 || entropy < 40) {
    return { score: 1, scoreLabel: 'weak' };
  }

  if (entropy < 60) {
    return { score: 2, scoreLabel: 'fair' };
  }

  if (entropy < 80) {
    return { score: 3, scoreLabel: 'strong' };
  }

  return { score: 4, scoreLabel: 'very_strong' };
}

/**
 * Generates security feedback warnings and recommendations.
 */
function generateFeedback(
  charset: PasswordCharsetAnalysis,
  patterns: PasswordPatternMatch[],
  score: PasswordScore
): { warnings: string[]; recommendations: string[] } {
  const warnings: string[] = [];
  const recommendations: string[] = [];

  if (patterns.some((p) => p.type === 'dictionary')) {
    warnings.push('This password is very common and easily guessed.');
  }
  if (patterns.some((p) => p.type === 'repeat')) {
    warnings.push('Repeated characters make the password easier to predict.');
  }
  if (patterns.some((p) => p.type === 'sequence')) {
    warnings.push('Sequential characters (e.g. 123, abc) reduce password strength.');
  }
  if (patterns.some((p) => p.type === 'keyboard')) {
    warnings.push('Keyboard patterns (e.g. qwerty) are detected by automated cracking tools.');
  }

  if (charset.length < 8) {
    recommendations.push('Use at least 8 characters. For maximum security, aim for 16 or more.');
  } else if (charset.length < 12) {
    recommendations.push('Increase the length of the password to at least 12 characters.');
  }

  if (!charset.hasUppercase) {
    recommendations.push('Add uppercase letters.');
  }
  if (!charset.hasLowercase) {
    recommendations.push('Add lowercase letters.');
  }
  if (!charset.hasDigits) {
    recommendations.push('Add numerical digits.');
  }
  if (!charset.hasSymbols) {
    recommendations.push('Add special symbols (e.g. !@#$%^&*).');
  }

  if (score >= 3 && recommendations.length === 0) {
    recommendations.push('Great password! Store it securely in a password manager.');
  }

  return { warnings, recommendations };
}

/**
 * Analyzes password strength and provides actionable security feedback.
 */
export function analyzePassword(
  password: string,
  options: PasswordAnalysisOptions = {}
): PasswordAnalysisResult {
  const minScore = options.minScore ?? 3;
  const minLength = options.minLength ?? 8;
  const userInputs = options.userInputs ?? [];

  const charset = analyzeCharset(password);
  const patterns = detectPatterns(password, userInputs);
  const entropy = calculateEntropy(charset, patterns);
  const { score, scoreLabel } = deriveScore(charset, entropy, patterns);
  const crackTimes = computeCrackTimes(entropy);
  const feedback = generateFeedback(charset, patterns, score);

  const isValid = score >= minScore && charset.length >= minLength;

  return {
    score,
    scoreLabel,
    entropy,
    crackTimes,
    charset,
    patterns,
    feedback,
    isValid
  };
}
