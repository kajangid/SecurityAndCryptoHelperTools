import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.test.ts',
        'src/bin/**',
        'src/index.ts',
        'src/shared/types.ts',
        'tsup.config.ts',
        'vitest.config.ts'
      ]
    }
  },
  define: {
    __PACKAGE_VERSION__: JSON.stringify(pkg.version)
  }
});
