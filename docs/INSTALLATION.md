# Installation & Setup Guide

`@omnidev-tools/crypto-security-tools` supports all modern JavaScript and TypeScript environments with zero external dependencies.

---

## Package Manager Installation

### NPM

```bash
npm install @omnidev-tools/crypto-security-tools
```

### PNPM

```bash
pnpm add @omnidev-tools/crypto-security-tools
```

### Yarn

```bash
yarn add @omnidev-tools/crypto-security-tools
```

### Bun

```bash
bun add @omnidev-tools/crypto-security-tools
```

---

## Global CLI Setup

To install the CLI globally for terminal use:

```bash
npm install -g @omnidev-tools/crypto-security-tools
```

Once installed, the unified command and all binary aliases are directly available in your shell:

```bash
# Main command
crypto-tools --version

# Dedicated aliases
password-strength "MyP@ssw0rd!"
hash-util "data" --algo sha256
token-gen --type uuid
api-key-gen --prefix sk_live
secret-gen --bits 256
link-signer --url "https://app.com/reset" --secret "my-secret"
```

---

## Import Patterns

### 1. Root Import

Imports everything from the main package index. Suitable for backend Node.js applications or serverless endpoints:

```typescript
import {
  analyzePassword,
  hash,
  generateApiKey,
  generateSignedLink,
  VERSION
} from '@omnidev-tools/crypto-security-tools';
```

### 2. Subpath Imports (Tree-Shaking)

The package defines granular `"exports"` and `"sideEffects": false` in `package.json`. Consumer web bundlers (Vite, Webpack, Rollup, esbuild) can eliminate all unreferenced utilities:

```typescript
// Imports only the password analysis engine (~8 KB)
import { analyzePassword } from '@omnidev-tools/crypto-security-tools/password-strength';

// Imports only the API key generator (~8 KB)
import { generateApiKey, verifyApiKey } from '@omnidev-tools/crypto-security-tools/api-key-generator';

// Imports only crypto utilities
import { getRandomBytes, randomInt } from '@omnidev-tools/crypto-security-tools/crypto-utils';
```

---

## TypeScript Configuration

For optimal type checking, ensure your `tsconfig.json` uses modern module resolution:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

If your project uses `NodeNext` resolution:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```
