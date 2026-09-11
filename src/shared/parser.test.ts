import { describe, it, expect } from 'vitest';
import { parseDuration, parseCliArgs } from './parser.js';

describe('shared/parser', () => {
  describe('parseDuration', () => {
    it('accepts numbers as milliseconds', () => {
      expect(parseDuration(1000)).toBe(1000);
      expect(parseDuration(0)).toBe(0);
      expect(parseDuration(1234.56)).toBe(1234);
    });

    it('parses valid duration strings', () => {
      expect(parseDuration('500ms')).toBe(500);
      expect(parseDuration('10s')).toBe(10000);
      expect(parseDuration('15m')).toBe(900000);
      expect(parseDuration('2h')).toBe(7200000);
      expect(parseDuration('1d')).toBe(86400000);
      expect(parseDuration('1w')).toBe(604800000);
    });

    it('handles decimal durations and uppercase units', () => {
      expect(parseDuration('1.5h')).toBe(5400000);
      expect(parseDuration('0.5s')).toBe(500);
      expect(parseDuration('30S')).toBe(30000);
      expect(parseDuration('10 M')).toBe(600000);
    });

    it('defaults to ms when no unit is given', () => {
      expect(parseDuration('2500')).toBe(2500);
    });

    it('throws errors on malformed inputs', () => {
      expect(() => parseDuration(-10)).toThrow(RangeError);
      expect(() => parseDuration(Infinity)).toThrow(RangeError);
      // @ts-expect-error test invalid type
      expect(() => parseDuration(null)).toThrow(TypeError);
      expect(() => parseDuration('')).toThrow(TypeError);
      expect(() => parseDuration('abc')).toThrow(RangeError);
      expect(() => parseDuration('10x')).toThrow(RangeError);
    });
  });

  describe('parseCliArgs', () => {
    it('parses basic flags and positionals', () => {
      const args = ['hash', 'hello', '--algo', 'sha256', '--json'];
      const parsed = parseCliArgs(args);

      expect(parsed.command).toBe('hash');
      expect(parsed.positional).toEqual(['hash', 'hello']);
      expect(parsed.options['algo']).toBe('sha256');
      expect(parsed.options['json']).toBe(true);
    });

    it('parses --key=value and --no-flag', () => {
      const args = ['--format=hex', '--no-checksum'];
      const parsed = parseCliArgs(args);

      expect(parsed.options['format']).toBe('hex');
      expect(parsed.options['checksum']).toBe(false);
    });

    it('parses short flags', () => {
      const args = ['-v', '-o', 'output.txt'];
      const parsed = parseCliArgs(args);

      expect(parsed.options['v']).toBe(true);
      expect(parsed.options['o']).toBe('output.txt');
    });

    it('respects the -- delimiter', () => {
      const args = ['cmd', '--flag', '--', '--not-a-flag', 'pos'];
      const parsed = parseCliArgs(args);

      expect(parsed.options['flag']).toBe(true);
      expect(parsed.options['not-a-flag']).toBeUndefined();
      expect(parsed.positional).toEqual(['cmd', '--not-a-flag', 'pos']);
    });

    it('blocks prototype pollution attempts', () => {
      const args = ['--__proto__=polluted', '--constructor=test', '--prototype=val'];
      const parsed = parseCliArgs(args);

      expect(parsed.options['__proto__']).toBeUndefined();
      expect(parsed.options['constructor']).toBeUndefined();
      expect(parsed.options['prototype']).toBeUndefined();
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    });
  });
});
