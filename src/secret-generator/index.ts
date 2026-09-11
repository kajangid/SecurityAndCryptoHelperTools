/**
 * High-entropy cryptographic secret and Diceware passphrase generation.
 */

import {
  SecretOptions,
  SecretResult,
  PassphraseOptions,
  PassphraseResult
} from '../shared/types.js';
import {
  getRandomBytes,
  randomInt,
  bytesToHex,
  bytesToBase64,
  bytesToBase64Url
} from '../crypto-utils/index.js';
import { validateLength } from '../shared/security.js';
import { WORDLIST } from './wordlist.js';

/**
 * Generates a high-entropy secret in the specified format (hex, base64, base64url, or binary).
 */
export function generateSecret(options: SecretOptions = {}): SecretResult {
  const bits = options.bits ?? 256;
  const format = options.format ?? 'hex';

  validateLength(bits, 64, 8192, 'Bits');
  if (bits % 8 !== 0) {
    throw new RangeError(`Bits must be a multiple of 8, received ${bits}.`);
  }

  const byteLength = bits / 8;
  const bytes = getRandomBytes(byteLength);

  let secret: string | Uint8Array;
  switch (format) {
    case 'binary':
      secret = bytes;
      break;
    case 'base64':
      secret = bytesToBase64(bytes);
      break;
    case 'base64url':
      secret = bytesToBase64Url(bytes);
      break;
    case 'hex':
    default:
      secret = bytesToHex(bytes);
      break;
  }

  return {
    secret,
    bits,
    format,
    entropy: bits
  };
}

/**
 * Generates a cryptographically secure, memorable Diceware-style passphrase.
 * Each word provides 11 bits of theoretical entropy (log2(2048) = 11).
 */
export function generatePassphrase(options: PassphraseOptions = {}): PassphraseResult {
  const wordsCount = options.words ?? 6;
  const separator = options.separator ?? '-';
  const capitalize = options.capitalize ?? false;
  const includeNumber = options.includeNumber ?? false;

  validateLength(wordsCount, 3, 32, 'Words count');

  const chosenWords: string[] = [];
  const listLen = WORDLIST.length;

  for (let i = 0; i < wordsCount; i++) {
    let word = WORDLIST[randomInt(0, listLen - 1)];
    if (capitalize) {
      word = word.charAt(0).toUpperCase() + word.slice(1);
    }
    chosenWords.push(word);
  }

  let entropy = wordsCount * 11; // 11 bits per word from 2048 wordlist

  if (includeNumber) {
    const num = randomInt(10, 99);
    chosenWords.push(num.toString());
    entropy += Math.round(Math.log2(90) * 10) / 10; // ~6.5 bits
  }

  const passphrase = chosenWords.join(separator);

  return {
    passphrase,
    words: wordsCount,
    entropy: Math.round(entropy * 10) / 10
  };
}

/**
 * Estimates the Shannon entropy of a secret string or buffer in bits.
 */
export function estimateSecretEntropy(secret: string | Uint8Array): { bits: number; strength: string } {
  if (!secret || secret.length === 0) {
    return { bits: 0, strength: 'low' };
  }

  const bytes = typeof secret === 'string' ? new TextEncoder().encode(secret) : secret;
  const length = bytes.length;

  // Calculate frequency of each byte
  const frequencies = new Map<number, number>();
  for (let i = 0; i < length; i++) {
    const b = bytes[i];
    frequencies.set(b, (frequencies.get(b) || 0) + 1);
  }

  // Shannon entropy formula: -sum(p * log2(p))
  let shannonPerByte = 0;
  for (const count of frequencies.values()) {
    const p = count / length;
    shannonPerByte -= p * Math.log2(p);
  }

  const totalBits = Math.round(shannonPerByte * length * 10) / 10;

  let strength = 'low';
  if (totalBits >= 256) strength = 'very_high';
  else if (totalBits >= 128) strength = 'high';
  else if (totalBits >= 64) strength = 'medium';

  return {
    bits: totalBits,
    strength
  };
}
