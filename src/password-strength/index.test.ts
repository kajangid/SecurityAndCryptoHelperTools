import { describe, it, expect } from 'vitest';
import { analyzePassword } from './index.js';

describe('password-strength', () => {
  it('identifies empty password as very_weak', () => {
    const res = analyzePassword('');
    expect(res.score).toBe(0);
    expect(res.scoreLabel).toBe('very_weak');
    expect(res.entropy).toBe(0);
    expect(res.isValid).toBe(false);
  });

  it('detects common blacklisted passwords', () => {
    const res = analyzePassword('password');
    expect(res.score).toBe(0);
    expect(res.scoreLabel).toBe('very_weak');
    expect(res.patterns.some((p) => p.type === 'dictionary')).toBe(true);
    expect(res.feedback.warnings.length).toBeGreaterThan(0);
    expect(res.isValid).toBe(false);
  });

  it('detects user-provided inputs within the password', () => {
    const res = analyzePassword('JohnDoeSecurePass2026!', {
      userInputs: ['JohnDoe']
    });
    expect(res.patterns.some((p) => p.type === 'dictionary' && p.pattern === 'JohnDoe')).toBe(true);
  });

  it('detects repeated sequences and sequential characters', () => {
    const res = analyzePassword('aaaa12345');
    expect(res.patterns.some((p) => p.type === 'repeat')).toBe(true);
    expect(res.patterns.some((p) => p.type === 'sequence')).toBe(true);
  });

  it('detects keyboard row sequences', () => {
    const res = analyzePassword('qwerty1234');
    expect(res.patterns.some((p) => p.type === 'keyboard')).toBe(true);
  });

  it('rates complex, high-entropy passwords as very_strong', () => {
    const res = analyzePassword('Correct-Horse-Battery-Staple-9284!#');
    expect(res.score).toBe(4);
    expect(res.scoreLabel).toBe('very_strong');
    expect(res.entropy).toBeGreaterThan(80);
    expect(res.isValid).toBe(true);
  });

  it('correctly populates charset breakdown', () => {
    const res = analyzePassword('Abc1#🚀');
    expect(res.charset.hasUppercase).toBe(true);
    expect(res.charset.hasLowercase).toBe(true);
    expect(res.charset.hasDigits).toBe(true);
    expect(res.charset.hasSymbols).toBe(true);
    expect(res.charset.hasUnicode).toBe(true);
    expect(res.charset.length).toBe(6);
  });

  it('provides all 4 crack time estimates', () => {
    const res = analyzePassword('mediumP@ss123');
    expect(res.crackTimes.onlineThrottled).toBeDefined();
    expect(res.crackTimes.onlineUnthrottled).toBeDefined();
    expect(res.crackTimes.offlineSlowHash).toBeDefined();
    expect(res.crackTimes.offlineFastHash).toBeDefined();
  });

  it('respects minScore and minLength options', () => {
    const resStrict = analyzePassword('FairPass1!', {
      minScore: 4,
      minLength: 16
    });
    expect(resStrict.isValid).toBe(false);

    const resRelaxed = analyzePassword('FairPass1!', {
      minScore: 2,
      minLength: 8
    });
    expect(resRelaxed.isValid).toBe(true);
  });
});
