# Deployment & Release Workflow

This document outlines the release engineering lifecycle for `@kjangid/security-tools`.

---

## 1. Single Source of Truth Versioning

`package.json` is the sole source of truth for the package version. Source files and CLI executables never hardcode the version string.

### Version Bumping Scripts

Use the pre-configured npm scripts to increment semantic versions and automatically generate a version commit and Git tag:

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

## 4. Production CI/CD Pipeline (GitHub Actions & OIDC)

The repository implements a two-stage CI/CD pipeline using **GitHub Actions** and **npm Trusted Publishing (OIDC)**:

### 1. CI Workflow (`.github/workflows/ci.yml`)
- **Triggers**: Pull requests and pushes targeting `main` and `master`.
- **Jobs**:
  - `npm ci`
  - `npm run lint` (`tsc --noEmit`)
  - `npm test`
  - `npm run build`

### 2. Release Workflow (`.github/workflows/release.yml`)
- **Triggers**: Pushes of Git tags matching `v*` (e.g. `v1.0.1`).
- **Permissions**:
  - `contents: write` (for GitHub Releases)
  - `id-token: write` (for npm OIDC provenance and trusted publishing)
- **Jobs**:
  - Checkouts the tagged commit
  - Runs clean install, lint, test, and build
  - Verifies that the Git tag version strictly matches the `package.json` version
  - Publishes to npm via **OIDC Trusted Publishing** (`npm publish --provenance --access public`)
  - Generates a GitHub Release with auto-generated release notes (`gh release create`)

---

## 5. One-Time Setup: npm Trusted Publishing

With npm Trusted Publishing, no long-lived `NPM_TOKEN` secret is needed in your GitHub repository.

1. Log in to [npmjs.com](https://www.npmjs.com).
2. Go to your package settings ➔ **Publishing Access** ➔ **Add a Trusted Publisher** ➔ **GitHub Actions** (or **Account Settings** ➔ **Publishing Access** for a new package).
3. Configure the publisher:
   - **GitHub Organization or User**: `kajangid`
   - **Repository Name**: `SecurityAndCryptoHelperTools`
   - **Workflow filename**: `release.yml`
   - **Environment name**: *(leave empty)*
   - **Package Name**: `@kjangid/security-tools`
4. Click **Add Trusted Publisher**. Releases can now be published seamlessly and securely via Git tags!
