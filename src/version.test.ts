import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { VERSION } from './version.js';

describe('version', () => {
  it('matches the exact version in package.json', () => {
    const pkg = JSON.parse(
      readFileSync(new URL('../package.json', import.meta.url), 'utf-8')
    );
    expect(VERSION).toBe(pkg.version);
  });

  it('is a valid semantic version string', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+(?:-[\w.]+)?$/);
  });
});
