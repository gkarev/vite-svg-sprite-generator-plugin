import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['__tests__/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['vite-svg-sprite-generator-plugin.js'],
      exclude: [
        'node_modules/',
        '__tests__/',
        '*.config.js',
        '*.d.ts'
      ]
    }
  }
});

