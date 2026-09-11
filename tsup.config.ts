import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default defineConfig({
  entry: {
    'index': 'src/index.ts',
    'version': 'src/version.ts',
    'password-strength/index': 'src/password-strength/index.ts',
    'hash/index': 'src/hash/index.ts',
    'token-generator/index': 'src/token-generator/index.ts',
    'api-key-generator/index': 'src/api-key-generator/index.ts',
    'secret-generator/index': 'src/secret-generator/index.ts',
    'crypto-utils/index': 'src/crypto-utils/index.ts',
    'link/index': 'src/link/index.ts',
    'bin/cli': 'src/bin/cli.ts'
  },
  format: ['esm', 'cjs'],
  outExtension({ format }) {
    return { js: format === 'esm' ? '.mjs' : '.cjs' };
  },
  dts: true,
  sourcemap: true,
  clean: true,
  shims: true,
  define: {
    __PACKAGE_VERSION__: JSON.stringify(pkg.version)
  }
});
