import { defineConfig } from 'vitest/config';

// The Vite extension build uses src/ as its UI root; tests live at repo root.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
