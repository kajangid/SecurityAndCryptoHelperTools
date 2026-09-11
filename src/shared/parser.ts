/**
 * Argument and duration parsing utilities with built-in prototype pollution defenses.
 */

import { safeRecord, isSafeKey } from './security.js';

/**
 * Parses duration strings like '15m', '2h', '7d', '30s', '500ms' into milliseconds.
 */
export function parseDuration(duration: string | number): number {
  if (typeof duration === 'number') {
    if (!Number.isFinite(duration) || duration < 0) {
      throw new RangeError(`Duration must be a positive finite number, received ${duration}.`);
    }
    return Math.floor(duration);
  }

  if (typeof duration !== 'string' || duration.trim() === '') {
    throw new TypeError('Duration must be a non-empty string or positive number.');
  }

  const trimmed = duration.trim().toLowerCase();
  const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d|w)?$/);

  if (!match) {
    throw new RangeError(`Invalid duration format: "${duration}". Supported units: ms, s, m, h, d, w.`);
  }

  const value = parseFloat(match[1]);
  const unit = match[2] || 'ms';

  let multiplier = 1;
  switch (unit) {
    case 'ms':
      multiplier = 1;
      break;
    case 's':
      multiplier = 1000;
      break;
    case 'm':
      multiplier = 60 * 1000;
      break;
    case 'h':
      multiplier = 60 * 60 * 1000;
      break;
    case 'd':
      multiplier = 24 * 60 * 60 * 1000;
      break;
    case 'w':
      multiplier = 7 * 24 * 60 * 60 * 1000;
      break;
  }

  return Math.round(value * multiplier);
}

export interface ParsedCliArgs {
  command?: string;
  positional: string[];
  options: Record<string, string | boolean>;
}

/**
 * Parses CLI arguments array with prototype pollution guards.
 */
export function parseCliArgs(args: string[]): ParsedCliArgs {
  const options = safeRecord<string | boolean>();
  const positional: string[] = [];

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === '--') {
      // Everything after '--' is a positional argument
      i++;
      while (i < args.length) {
        positional.push(args[i]);
        i++;
      }
      break;
    }

    if (arg.startsWith('--')) {
      const body = arg.slice(2);
      if (body.startsWith('no-')) {
        const key = body.slice(3);
        if (isSafeKey(key)) {
          options[key] = false;
        }
      } else if (body.includes('=')) {
        const eqIdx = body.indexOf('=');
        const key = body.slice(0, eqIdx);
        const val = body.slice(eqIdx + 1);
        if (isSafeKey(key)) {
          options[key] = val;
        }
      } else {
        const nextArg = args[i + 1];
        if (nextArg !== undefined && !nextArg.startsWith('-')) {
          if (isSafeKey(body)) {
            options[body] = nextArg;
          }
          i++; // skip nextArg
        } else {
          if (isSafeKey(body)) {
            options[body] = true;
          }
        }
      }
    } else if (arg.startsWith('-') && arg.length > 1) {
      const flag = arg.slice(1);
      // Single character or short flag
      const nextArg = args[i + 1];
      if (nextArg !== undefined && !nextArg.startsWith('-')) {
        if (isSafeKey(flag)) {
          options[flag] = nextArg;
        }
        i++;
      } else {
        if (isSafeKey(flag)) {
          options[flag] = true;
        }
      }
    } else {
      positional.push(arg);
    }

    i++;
  }

  const command = positional.length > 0 ? positional[0] : undefined;

  return {
    command,
    positional,
    options
  };
}

/**
 * Reads UTF-8 data from standard input if piped or redirected.
 * Includes a timeout safeguard to prevent hanging in non-TTY environments.
 */
export async function readStdin(timeoutMs = 150): Promise<string> {
  if (process.stdin.isTTY || process.env.VITEST) {
    return '';
  }

  return new Promise((resolve) => {
    let content = '';
    let timer: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timer) clearTimeout(timer);
      process.stdin.removeListener('data', onData);
      process.stdin.removeListener('end', onEnd);
      process.stdin.removeListener('error', onError);
    };

    const onData = (chunk: string | Buffer) => {
      content += chunk;
    };

    const onEnd = () => {
      cleanup();
      resolve(content);
    };

    const onError = () => {
      cleanup();
      resolve(content);
    };

    process.stdin.setEncoding('utf8');
    process.stdin.on('data', onData);
    process.stdin.on('end', onEnd);
    process.stdin.on('error', onError);

    timer = setTimeout(() => {
      cleanup();
      resolve(content);
    }, timeoutMs);
  });
}
