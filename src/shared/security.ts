/**
 * Security primitives: prototype pollution guards, safe record factories,
 * constant-time equality comparisons, and input validators.
 */

const DANGEROUS_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

/**
 * Creates an object with a null prototype, immune to Object prototype pollution.
 */
export function safeRecord<T = unknown>(): Record<string, T> {
  return Object.create(null) as Record<string, T>;
}

/**
 * Checks if a property name is safe from prototype pollution attacks.
 */
export function isSafeKey(key: unknown): boolean {
  if (typeof key !== 'string') return false;
  return !DANGEROUS_KEYS.has(key);
}

/**
 * Checks if an object has its own property safely without accessing prototype.
 */
export function hasOwn(obj: object, key: string | symbol): boolean {
  if (obj === null || typeof obj !== 'object') return false;
  return Object.prototype.hasOwnProperty.call(obj, key);
}

/**
 * Safely copies properties into target while stripping prototype-polluting keys.
 */
export function safeAssign<T extends object>(target: T, ...sources: Array<Record<string, unknown> | null | undefined>): T {
  for (const source of sources) {
    if (source && typeof source === 'object') {
      const keys = Object.keys(source);
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        if (isSafeKey(key)) {
          (target as Record<string, unknown>)[key] = source[key];
        }
      }
    }
  }
  return target;
}

/**
 * Recursively freezes an object and its nested properties to guarantee immutability.
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
  if (obj === null || typeof obj !== 'object' || Object.isFrozen(obj)) {
    return obj;
  }

  Object.freeze(obj);

  const keys = Object.getOwnPropertyNames(obj);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const val = (obj as Record<string, unknown>)[key];
    if (val !== null && (typeof val === 'object' || typeof val === 'function')) {
      deepFreeze(val);
    }
  }

  return obj;
}

/**
 * Constant-time comparison between two strings or Uint8Arrays to prevent timing attacks.
 */
export function timingSafeEqual(a: string | Uint8Array, b: string | Uint8Array): boolean {
  const bufA: Uint8Array = typeof a === 'string' ? new TextEncoder().encode(a) : a;
  const bufB: Uint8Array = typeof b === 'string' ? new TextEncoder().encode(b) : b;

  // If lengths differ, we still iterate through the length of bufA to prevent
  // simple timing leaks, but we ensure the return value is false.
  if (bufA.length !== bufB.length) {
    let dummy = 0;
    for (let i = 0; i < bufA.length; i++) {
      dummy |= bufA[i] ^ (bufA[i] || 0);
    }
    // Access dummy to prevent dead-code elimination
    return dummy !== 0 && false;
  }

  let result = 0;
  for (let i = 0; i < bufA.length; i++) {
    result |= bufA[i] ^ bufB[i];
  }

  return result === 0;
}

/**
 * Validates that an integer or length is within the specified inclusive bounds.
 */
export function validateLength(
  value: number,
  min: number,
  max: number,
  field = 'Value'
): void {
  if (!Number.isInteger(value)) {
    throw new TypeError(`${field} must be an integer.`);
  }
  if (value < min || value > max) {
    throw new RangeError(`${field} must be between ${min} and ${max}, received ${value}.`);
  }
}
