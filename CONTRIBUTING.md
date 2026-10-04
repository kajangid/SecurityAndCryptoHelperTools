# Contributing to @kjangid/security-tools

Thank you for contributing! This guide covers local development, testing, and release scripts.

## Prerequisites

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0

## Getting Started

```bash
git clone https://github.com/kajangid/SecurityAndCryptoHelperTools.git
cd SecurityAndCryptoHelperTools
npm ci
```

## Development Scripts

| Command | Description |
| :--- | :--- |
| `npm run build` | Compiles dual ESM (`.mjs`), CJS (`.cjs`), and DTS bundles via `tsup` |
| `npm test` | Runs the Vitest test suite (137 tests across 12 suites) |
| `npm run test:watch` | Runs Vitest in interactive watch mode |
| `npm run test:coverage` | Generates statement, branch, and function coverage reports |
| `npm run lint` | Type-checks the codebase via `tsc --noEmit` |
| `npm run typecheck` | Strict TypeScript compiler validation |
| `npm run publish:dry` | Verifies the npm pack tarball contents and size |

## Quality Gates

Before opening a PR, ensure:
1. `npm run lint` passes with 0 errors.
2. `npm test` passes with 100% coverage across new logic.
3. `npm run build` completes cleanly.
4. No external runtime dependencies are added (`dependencies` must remain `{}`).

## Releases

Releases are fully automated via GitHub Actions and npm Trusted Publishing (OIDC). See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).
