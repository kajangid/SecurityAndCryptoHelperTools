#!/usr/bin/env node

/**
 * Multi-command CLI executable and binary aliases for @omnidev-tools/crypto-security-tools.
 */

import { basename } from 'node:path';
import { VERSION } from '../version.js';
import { parseCliArgs, readStdin } from '../shared/parser.js';
import { analyzePassword } from '../password-strength/index.js';
import { hash, hmac } from '../hash/index.js';
import { generateToken } from '../token-generator/index.js';
import { generateApiKey, verifyApiKey, maskApiKey } from '../api-key-generator/index.js';
import { generateSecret, generatePassphrase } from '../secret-generator/index.js';
import { generateSignedLink, verifySignedLink } from '../link/index.js';
import { HashAlgorithm, Encoding, TokenType, SecretFormat } from '../shared/types.js';

const HELP_TEXT = `
@omnidev-tools/crypto-security-tools v${VERSION}

Usage:
  crypto-tools <command> [options]

Commands:
  password-strength <pwd>     Analyze password strength, entropy & crack times
  hash <data>                 Generate SHA-family hashes or HMAC digests
  token                       Generate cryptographically secure tokens
  api-key                     Generate, verify, or mask prefixed API keys
  secret                      Generate high-entropy secrets or Diceware passphrases
  link                        Generate or verify tamper-proof signed URLs

Global Options:
  --help, -h                  Show help documentation
  --version, -v               Show package version
  --json                      Output results in JSON format

Examples:
  crypto-tools password-strength "CorrectHorseBatteryStaple!"
  echo "secret message" | crypto-tools hash --algo sha256
  crypto-tools token --type alphanumeric --length 32
  crypto-tools api-key --prefix sk_live
  crypto-tools secret --passphrase --words 6
  crypto-tools link --url "https://api.com/reset" --secret "key123" --expires 30m
`;

/**
 * Core CLI execution function returning output and exit codes.
 */
export async function runCli(
  rawArgs: string[],
  injectedStdin?: string
): Promise<{ exitCode: number; stdout: string; stderr: string }> {
  let stdout = '';
  let stderr = '';

  const out = (msg: string) => {
    stdout += msg;
  };
  const err = (msg: string) => {
    stderr += msg;
  };

  // 1. Mandatory requirement: Evaluate --version / -v FIRST before any other checks
  if (rawArgs.includes('--version') || rawArgs.includes('-v')) {
    out(`${VERSION}\n`);
    return { exitCode: 0, stdout, stderr };
  }

  // Detect binary alias
  const invokedBinary = rawArgs[1]
    ? basename(rawArgs[1]).replace(/\.(c|m)?js$/, '')
    : '';
  let args = rawArgs.slice(2);

  if (invokedBinary === 'password-strength') {
    args = ['password-strength', ...args];
  } else if (invokedBinary === 'hash-util') {
    args = ['hash', ...args];
  } else if (invokedBinary === 'token-gen') {
    args = ['token', ...args];
  } else if (invokedBinary === 'api-key-gen') {
    args = ['api-key', ...args];
  } else if (invokedBinary === 'secret-gen') {
    args = ['secret', ...args];
  } else if (invokedBinary === 'link-signer') {
    args = ['link', ...args];
  }

  // 2. Evaluate help or empty arguments
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    out(`${HELP_TEXT.trim()}\n`);
    return { exitCode: 0, stdout, stderr };
  }

  const parsed = parseCliArgs(args);
  const command = parsed.command;
  const isJson = Boolean(parsed.options['json']);

  // Get data from positional args or piped stdin
  let inputData = parsed.positional.slice(1).join(' ').trim();
  if (!inputData) {
    const piped = injectedStdin !== undefined ? injectedStdin : await readStdin();
    inputData = piped.trim();
  }

  try {
    switch (command) {
      case 'password-strength': {
        if (!inputData) {
          err('Error: Password must be provided as an argument or via standard input.\n');
          return { exitCode: 2, stdout, stderr };
        }

        const minScore = parsed.options['min-score']
          ? (parseInt(String(parsed.options['min-score']), 10) as 0 | 1 | 2 | 3 | 4)
          : 3;
        const minLength = parsed.options['min-length']
          ? parseInt(String(parsed.options['min-length']), 10)
          : 8;

        const res = analyzePassword(inputData, { minScore, minLength });

        if (isJson) {
          out(JSON.stringify(res, null, 2) + '\n');
        } else {
          out(`Score: ${res.score}/4 (${res.scoreLabel})\n`);
          out(`Entropy: ${res.entropy} bits\n`);
          out(`Crack Times:\n`);
          out(`  Online (throttled):   ${res.crackTimes.onlineThrottled}\n`);
          out(`  Online (unthrottled): ${res.crackTimes.onlineUnthrottled}\n`);
          out(`  Offline (slow hash):  ${res.crackTimes.offlineSlowHash}\n`);
          out(`  Offline (fast hash):  ${res.crackTimes.offlineFastHash}\n`);
          if (res.feedback.warnings.length > 0) {
            out(`Warnings:\n${res.feedback.warnings.map((w) => `  - ${w}`).join('\n')}\n`);
          }
          if (res.feedback.recommendations.length > 0) {
            out(`Recommendations:\n${res.feedback.recommendations.map((r) => `  - ${r}`).join('\n')}\n`);
          }
        }

        return { exitCode: res.isValid ? 0 : 1, stdout, stderr };
      }

      case 'hash': {
        if (!inputData) {
          err('Error: Data to hash must be provided as an argument or via standard input.\n');
          return { exitCode: 2, stdout, stderr };
        }

        const algo = (parsed.options['algo'] as string) || 'SHA-256';
        const encoding = (parsed.options['encoding'] as Encoding) || 'hex';
        const key = parsed.options['key'] as string | undefined;

        let digest: string | Uint8Array;
        if (key) {
          digest = hmac(key, inputData, algo as HashAlgorithm, encoding);
        } else {
          digest = hash(inputData, algo as HashAlgorithm, encoding);
        }

        if (isJson) {
          out(JSON.stringify({ algorithm: algo, encoding, digest }, null, 2) + '\n');
        } else {
          out(`${digest}\n`);
        }
        return { exitCode: 0, stdout, stderr };
      }

      case 'token': {
        const type = (parsed.options['type'] as TokenType) || 'base64url';
        const length = parsed.options['length'] ? parseInt(String(parsed.options['length']), 10) : undefined;
        const prefix = parsed.options['prefix'] as string | undefined;
        const suffix = parsed.options['suffix'] as string | undefined;
        const alphabet = parsed.options['alphabet'] as string | undefined;

        const token = generateToken({
          type,
          length,
          prefix,
          suffix,
          customAlphabet: alphabet
        });

        if (isJson) {
          out(JSON.stringify({ token, type }, null, 2) + '\n');
        } else {
          out(`${token}\n`);
        }
        return { exitCode: 0, stdout, stderr };
      }

      case 'api-key': {
        // Verification mode
        if (parsed.options['verify']) {
          const keyToVerify = String(parsed.options['verify']);
          const prefix = parsed.options['prefix'] as string | undefined;
          const verifyRes = verifyApiKey(keyToVerify, { prefix });

          if (isJson) {
            out(JSON.stringify(verifyRes, null, 2) + '\n');
          } else {
            out(verifyRes.valid ? `Valid: Key verified successfully (${verifyRes.prefix})\n` : `Invalid: ${verifyRes.reason}\n`);
          }
          return { exitCode: verifyRes.valid ? 0 : 1, stdout, stderr };
        }

        // Masking mode
        if (parsed.options['mask']) {
          const keyToMask = String(parsed.options['mask']);
          const masked = maskApiKey(keyToMask);
          if (isJson) {
            out(JSON.stringify({ masked }, null, 2) + '\n');
          } else {
            out(`${masked}\n`);
          }
          return { exitCode: 0, stdout, stderr };
        }

        // Generation mode
        const prefix = (parsed.options['prefix'] as string) || 'key';
        const byteLength = parsed.options['bytes'] ? parseInt(String(parsed.options['bytes']), 10) : 24;
        const delimiter = (parsed.options['delimiter'] as string) || '_';
        const includeChecksum = parsed.options['checksum'] !== false;

        const generated = generateApiKey({ prefix, byteLength, delimiter, includeChecksum });
        if (isJson) {
          out(JSON.stringify(generated, null, 2) + '\n');
        } else {
          out(`${generated.key}\n`);
        }
        return { exitCode: 0, stdout, stderr };
      }

      case 'secret': {
        if (parsed.options['passphrase']) {
          const words = parsed.options['words'] ? parseInt(String(parsed.options['words']), 10) : 6;
          const separator = (parsed.options['separator'] as string) || '-';
          const capitalize = Boolean(parsed.options['capitalize']);
          const includeNumber = Boolean(parsed.options['number']);

          const passRes = generatePassphrase({ words, separator, capitalize, includeNumber });
          if (isJson) {
            out(JSON.stringify(passRes, null, 2) + '\n');
          } else {
            out(`${passRes.passphrase}\n`);
          }
          return { exitCode: 0, stdout, stderr };
        }

        const bits = parsed.options['bits'] ? parseInt(String(parsed.options['bits']), 10) : 256;
        const format = (parsed.options['format'] as SecretFormat) || 'hex';
        const secRes = generateSecret({ bits, format });

        if (isJson) {
          out(JSON.stringify(secRes, null, 2) + '\n');
        } else {
          out(`${secRes.secret}\n`);
        }
        return { exitCode: 0, stdout, stderr };
      }

      case 'link': {
        // Verification mode
        if (parsed.options['verify']) {
          const urlToVerify = String(parsed.options['verify']);
          const secret = parsed.options['secret'] as string;
          if (!secret) {
            err('Error: --secret is required when verifying a link.\n');
            return { exitCode: 2, stdout, stderr };
          }

          const verifyRes = verifySignedLink(urlToVerify, secret);
          if (isJson) {
            out(JSON.stringify(verifyRes, null, 2) + '\n');
          } else {
            out(verifyRes.valid ? 'Valid: Link signature and expiration verified.\n' : `Invalid: ${verifyRes.reason}\n`);
          }
          return { exitCode: verifyRes.valid ? 0 : 1, stdout, stderr };
        }

        // Signing mode
        const baseUrl = parsed.options['url'] as string;
        const secret = parsed.options['secret'] as string;
        const expiresIn = (parsed.options['expires'] as string) || '1h';

        if (!baseUrl || !secret) {
          err('Error: Both --url and --secret are required to generate a signed link.\n');
          return { exitCode: 2, stdout, stderr };
        }

        const linkRes = generateSignedLink({ baseUrl, secret, expiresIn });
        if (isJson) {
          out(JSON.stringify(linkRes, null, 2) + '\n');
        } else {
          out(`${linkRes.url}\n`);
        }
        return { exitCode: 0, stdout, stderr };
      }

      default:
        err(`Error: Unknown command "${command}". Run with --help to view available commands.\n`);
        return { exitCode: 2, stdout, stderr };
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    err(`Error: ${msg}\n`);
    return { exitCode: 1, stdout, stderr };
  }
}

// Standalone execution runner
if (process.argv[1] && (process.argv[1].endsWith('cli.ts') || process.argv[1].endsWith('cli.cjs') || process.argv[1].endsWith('cli.mjs'))) {
  runCli(process.argv).then(({ exitCode, stdout, stderr }) => {
    if (stdout) process.stdout.write(stdout);
    if (stderr) process.stderr.write(stderr);
    process.exit(exitCode);
  });
}
