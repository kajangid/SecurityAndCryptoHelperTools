import { describe, it, expect } from 'vitest';
import { runCli } from './cli.js';
import { VERSION } from '../version.js';

describe('bin/cli', () => {
  describe('Global flags', () => {
    it('outputs version on --version or -v with exit code 0', async () => {
      const res1 = await runCli(['node', 'cli.js', '--version']);
      expect(res1.exitCode).toBe(0);
      expect(res1.stdout).toBe(`${VERSION}\n`);

      const res2 = await runCli(['node', 'cli.js', '-v']);
      expect(res2.exitCode).toBe(0);
      expect(res2.stdout).toBe(`${VERSION}\n`);
    });

    it('processes --version before other commands or arguments', async () => {
      const res = await runCli(['node', 'cli.js', 'unknown-cmd', '--version']);
      expect(res.exitCode).toBe(0);
      expect(res.stdout).toBe(`${VERSION}\n`);
    });

    it('displays help documentation on --help or -h with exit code 0', async () => {
      const res = await runCli(['node', 'cli.js', '--help']);
      expect(res.exitCode).toBe(0);
      expect(res.stdout).toContain('Usage:');
      expect(res.stdout).toContain('crypto-tools <command>');
    });

    it('displays help on no arguments with exit code 0', async () => {
      const res = await runCli(['node', 'cli.js']);
      expect(res.exitCode).toBe(0);
      expect(res.stdout).toContain('Usage:');
    });

    it('returns exit code 2 for unknown commands', async () => {
      const res = await runCli(['node', 'cli.js', 'invalid-command-xyz']);
      expect(res.exitCode).toBe(2);
      expect(res.stderr).toContain('Unknown command');
    });
  });

  describe('password-strength command', () => {
    it('analyzes password argument and returns exit code 0 for strong passwords', async () => {
      const res = await runCli(['node', 'cli.js', 'password-strength', 'CorrectHorseBatteryStaple!2026']);
      expect(res.exitCode).toBe(0);
      expect(res.stdout).toContain('Score:');
      expect(res.stdout).toContain('Crack Times:');
    });

    it('returns exit code 1 when password fails minScore', async () => {
      const res = await runCli(['node', 'cli.js', 'password-strength', '12345', '--min-score', '3']);
      expect(res.exitCode).toBe(1);
      expect(res.stdout).toContain('Score: 0/4');
    });

    it('supports piped stdin', async () => {
      const res = await runCli(['node', 'cli.js', 'password-strength'], 'MyStr0ngP@ssw0rd!!');
      expect(res.exitCode).toBe(0);
      expect(res.stdout).toContain('Score:');
    });

    it('outputs JSON when --json flag is provided', async () => {
      const res = await runCli(['node', 'cli.js', 'password-strength', 'ValidPass123!', '--json']);
      expect(res.exitCode).toBe(0);
      const parsed = JSON.parse(res.stdout);
      expect(parsed.score).toBeDefined();
      expect(parsed.crackTimes).toBeDefined();
    });

    it('returns exit code 2 when password is missing', async () => {
      const res = await runCli(['node', 'cli.js', 'password-strength'], '');
      expect(res.exitCode).toBe(2);
      expect(res.stderr).toContain('Error: Password must be provided');
    });
  });

  describe('hash command', () => {
    it('computes SHA-256 digest', async () => {
      const res = await runCli(['node', 'cli.js', 'hash', 'abc', '--algo', 'sha256']);
      expect(res.exitCode).toBe(0);
      expect(res.stdout.trim()).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    });

    it('computes HMAC with --key', async () => {
      const res = await runCli([
        'node',
        'cli.js',
        'hash',
        'The quick brown fox jumps over the lazy dog',
        '--key',
        'key',
        '--algo',
        'sha256'
      ]);
      expect(res.exitCode).toBe(0);
      expect(res.stdout.trim()).toBe('f7bc83f430538424b13298e6aa6fb143ef4d59a14946175997479dbc2d1a3cd8');
    });

    it('reads input data from piped stdin', async () => {
      const res = await runCli(['node', 'cli.js', 'hash', '--algo', 'sha256'], 'abc');
      expect(res.exitCode).toBe(0);
      expect(res.stdout.trim()).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    });

    it('returns exit code 2 when input data is missing', async () => {
      const res = await runCli(['node', 'cli.js', 'hash'], '');
      expect(res.exitCode).toBe(2);
      expect(res.stderr).toContain('Data to hash must be provided');
    });
  });

  describe('token command', () => {
    it('generates random tokens with custom lengths and prefixes', async () => {
      const res = await runCli([
        'node',
        'cli.js',
        'token',
        '--type',
        'alphanumeric',
        '--length',
        '20',
        '--prefix',
        'tk_'
      ]);
      expect(res.exitCode).toBe(0);
      const token = res.stdout.trim();
      expect(token.startsWith('tk_')).toBe(true);
      expect(token.length).toBe(23);
    });

    it('outputs JSON token structure', async () => {
      const res = await runCli(['node', 'cli.js', 'token', '--type', 'uuid', '--json']);
      expect(res.exitCode).toBe(0);
      const data = JSON.parse(res.stdout);
      expect(data.type).toBe('uuid');
      expect(data.token).toBeDefined();
    });
  });

  describe('api-key command', () => {
    it('generates an API key and subsequently verifies it', async () => {
      const genRes = await runCli(['node', 'cli.js', 'api-key', '--prefix', 'sk_test', '--json']);
      expect(genRes.exitCode).toBe(0);
      const { key } = JSON.parse(genRes.stdout);

      const verifyRes = await runCli(['node', 'cli.js', 'api-key', '--verify', key]);
      expect(verifyRes.exitCode).toBe(0);
      expect(verifyRes.stdout).toContain('Valid: Key verified successfully');
    });

    it('fails verification on corrupted API keys', async () => {
      const verifyRes = await runCli(['node', 'cli.js', 'api-key', '--verify', 'sk_test_corrupted_12345678']);
      expect(verifyRes.exitCode).toBe(1);
      expect(verifyRes.stdout).toContain('Invalid:');
    });

    it('masks API keys with --mask', async () => {
      const maskRes = await runCli(['node', 'cli.js', 'api-key', '--mask', 'sk_live_1234567890abcdef_12345678']);
      expect(maskRes.exitCode).toBe(0);
      expect(maskRes.stdout).toContain('••••');
    });
  });

  describe('secret command', () => {
    it('generates a 256-bit secret', async () => {
      const res = await runCli(['node', 'cli.js', 'secret', '--bits', '256', '--format', 'hex']);
      expect(res.exitCode).toBe(0);
      expect(res.stdout.trim().length).toBe(64);
    });

    it('generates Diceware passphrases with --passphrase', async () => {
      const res = await runCli(['node', 'cli.js', 'secret', '--passphrase', '--words', '5', '--separator', '.']);
      expect(res.exitCode).toBe(0);
      const parts = res.stdout.trim().split('.');
      expect(parts.length).toBe(5);
    });
  });

  describe('link command', () => {
    it('generates a signed link and verifies it', async () => {
      const genRes = await runCli([
        'node',
        'cli.js',
        'link',
        '--url',
        'https://app.com/confirm',
        '--secret',
        'top-secret-99',
        '--expires',
        '1h',
        '--json'
      ]);
      expect(genRes.exitCode).toBe(0);
      const { url } = JSON.parse(genRes.stdout);

      const verifyRes = await runCli(['node', 'cli.js', 'link', '--verify', url, '--secret', 'top-secret-99']);
      expect(verifyRes.exitCode).toBe(0);
      expect(verifyRes.stdout).toContain('Valid: Link signature and expiration verified');
    });

    it('returns exit code 2 when required parameters are missing', async () => {
      const res = await runCli(['node', 'cli.js', 'link', '--url', 'https://app.com/confirm']);
      expect(res.exitCode).toBe(2);
      expect(res.stderr).toContain('Both --url and --secret are required');
    });
  });

  describe('Binary aliases', () => {
    it('invokes password-strength when binary name matches alias', async () => {
      const res = await runCli(['node', '/usr/bin/password-strength', 'CorrectHorseBatteryStaple!2026']);
      expect(res.exitCode).toBe(0);
      expect(res.stdout).toContain('Score:');
    });

    it('invokes hash-util when binary name matches alias', async () => {
      const res = await runCli(['node', '/usr/bin/hash-util', 'abc']);
      expect(res.exitCode).toBe(0);
      expect(res.stdout.trim()).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    });

    it('invokes token-gen when binary name matches alias', async () => {
      const res = await runCli(['node', '/usr/bin/token-gen', '--type', 'numeric', '--length', '6']);
      expect(res.exitCode).toBe(0);
      expect(res.stdout.trim()).toMatch(/^\d{6}$/);
    });
  });
});
