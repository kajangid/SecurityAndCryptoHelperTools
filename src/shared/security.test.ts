import { describe, it, expect } from 'vitest';
import {
  safeRecord,
  isSafeKey,
  hasOwn,
  safeAssign,
  deepFreeze,
  timingSafeEqual,
  validateLength
} from './security.js';

describe('shared/security', () => {
  describe('safeRecord', () => {
    it('creates an object with null prototype', () => {
      const rec = safeRecord<string>();
      expect(Object.getPrototypeOf(rec)).toBeNull();
      expect(rec.toString).toBeUndefined();
      expect(rec.valueOf).toBeUndefined();
      expect(rec.__proto__).toBeUndefined();

      rec['key'] = 'value';
      expect(rec['key']).toBe('value');
    });
  });

  describe('isSafeKey', () => {
    it('blocks dangerous prototype pollution keys', () => {
      expect(isSafeKey('__proto__')).toBe(false);
      expect(isSafeKey('constructor')).toBe(false);
      expect(isSafeKey('prototype')).toBe(false);
      expect(isSafeKey(123)).toBe(false);
      expect(isSafeKey(null)).toBe(false);
      expect(isSafeKey(undefined)).toBe(false);
    });

    it('allows safe keys', () => {
      expect(isSafeKey('validKey')).toBe(true);
      expect(isSafeKey('token')).toBe(true);
      expect(isSafeKey('id')).toBe(true);
    });
  });

  describe('hasOwn', () => {
    it('accurately identifies own properties', () => {
      const obj = { a: 1 };
      expect(hasOwn(obj, 'a')).toBe(true);
      expect(hasOwn(obj, 'toString')).toBe(false);
      expect(hasOwn(null as unknown as object, 'a')).toBe(false);
      expect(hasOwn(undefined as unknown as object, 'a')).toBe(false);
    });
  });

  describe('safeAssign', () => {
    it('safely copies safe properties and strips polluted keys', () => {
      const target: Record<string, unknown> = {};
      const malicious = JSON.parse('{"__proto__": {"admin": true}, "name": "alice"}');

      safeAssign(target, malicious);
      expect(target.name).toBe('alice');
      expect((target as Record<string, unknown>).__proto__).toBe(Object.prototype);
      expect(({} as Record<string, unknown>).admin).toBeUndefined();
    });

    it('ignores null and undefined sources', () => {
      const target = { a: 1 };
      safeAssign(target, null, undefined);
      expect(target.a).toBe(1);
    });
  });

  describe('deepFreeze', () => {
    it('deeply freezes nested objects', () => {
      const obj = {
        nested: {
          val: 42
        },
        arr: [1, 2, 3]
      };

      const frozen = deepFreeze(obj);
      expect(Object.isFrozen(frozen)).toBe(true);
      expect(Object.isFrozen(frozen.nested)).toBe(true);
      expect(Object.isFrozen(frozen.arr)).toBe(true);

      expect(() => {
        // @ts-expect-error test mutation
        frozen.nested.val = 99;
      }).toThrow();
    });

    it('handles primitives gracefully', () => {
      expect(deepFreeze(null)).toBeNull();
      expect(deepFreeze(42)).toBe(42);
      expect(deepFreeze('str')).toBe('str');
    });
  });

  describe('timingSafeEqual', () => {
    it('returns true for identical inputs', () => {
      expect(timingSafeEqual('secret-12345', 'secret-12345')).toBe(true);
      expect(timingSafeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 3]))).toBe(true);
      expect(timingSafeEqual('', '')).toBe(true);
      expect(timingSafeEqual(new Uint8Array(), new Uint8Array())).toBe(true);
    });

    it('returns false for differing inputs of same length', () => {
      expect(timingSafeEqual('secret-12345', 'secret-12349')).toBe(false);
      expect(timingSafeEqual(new Uint8Array([1, 2, 3]), new Uint8Array([1, 2, 4]))).toBe(false);
    });

    it('returns false for differing lengths', () => {
      expect(timingSafeEqual('short', 'longer-string')).toBe(false);
      expect(timingSafeEqual(new Uint8Array([1, 2]), new Uint8Array([1, 2, 3]))).toBe(false);
    });
  });

  describe('validateLength', () => {
    it('validates integer ranges correctly', () => {
      expect(() => validateLength(10, 5, 20)).not.toThrow();
      expect(() => validateLength(5, 5, 20)).not.toThrow();
      expect(() => validateLength(20, 5, 20)).not.toThrow();
    });

    it('throws TypeError for non-integers', () => {
      expect(() => validateLength(10.5, 5, 20)).toThrow(TypeError);
      // @ts-expect-error test invalid type
      expect(() => validateLength('10', 5, 20)).toThrow(TypeError);
    });

    it('throws RangeError for out-of-range values', () => {
      expect(() => validateLength(4, 5, 20)).toThrow(RangeError);
      expect(() => validateLength(21, 5, 20)).toThrow(RangeError);
    });
  });
});
