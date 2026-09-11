# Deployment & Release Workflow

This document outlines the release engineering lifecycle for `@omnidev-tools/crypto-security-tools`.

---

## 1. Single Source of Truth Versioning

`package.json` is the sole source of truth for the package version. Source files and CLI executables never hardcode the version string.

### Version Bumping Scripts

Use the pre-configured npm scripts to increment semantic versions:

```bash
# Bug fixes and security patches (e.g. 1.0.0 -> 1.0.1)
npm run bump:patch

# Backward-compatible feature additions (e.g. 1.0.0 -> 1.1.0)
npm run bump:minor

# Breaking architectural changes (e.g. 1.0.0 -> 2.0.0)
npm run bump:major
```

These scripts execute `npm version`, which:
1. Updates `"version"` in `package.json` and `package-lock.json`.
2. Creates a Git commit and an annotated tag `vX.Y.Z`.
3. When `tsup` runs during build, compile-time `define: { __PACKAGE_VERSION__: JSON.stringify(pkg.version) }` bakes the updated version into the compiled ESM and CommonJS artifacts.

---

## 2. Pre-Publish Validation Pipeline

The `package.json` configures a strict `prepublishOnly` lifecycle hook:

```json
"scripts": {
  "prepublishOnly": "npm run typecheck && npm run test && npm run build"
}
```

Before any artifact is packaged or published:
1. **`typecheck`**: Validates strict TypeScript compilation without emit (`tsc --noEmit`).
2. **`test`**: Runs all 12 test suites (137 tests) in Vitest.
3. **`build`**: Rebuilds fresh dual ESM (`.mjs`), CommonJS (`.cjs`), and DTS bundles.

---

## 3. Dry-Run Verification

Before publishing to NPM, execute a dry-run to verify the tarball contents and bundle sizes:

```bash
npm run publish:dry
```

Ensure only the intended files are packaged:
- `dist/`
- `README.md`
- `LICENSE`
- `package.json`

---

## 4. GitHub Actions CI/CD Pipeline

Create `.github/workflows/ci.yml` in your repository:

```yaml
name: CI & Publish

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Typecheck
        run: npm run typecheck

      - name: Run Test Suite & Coverage
        run: npm run test:coverage

      - name: Build Dual ESM/CJS & Types
        run: npm run build

  publish:
    needs: validate
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          registry-url: 'https://registry.npmjs.org'

      - name: Install Dependencies
        run: npm ci

      - name: Publish to NPM
        run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```
