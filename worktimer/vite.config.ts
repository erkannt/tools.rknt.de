import { defineConfig } from 'vitest/config'
import { svelte } from '@sveltejs/vite-plugin-svelte'

export default defineConfig({
  plugins: [svelte()],
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.ts'],
    server: {
      deps: {
        inline: ['@testing-library/svelte'],
      },
    },
  },
  resolve: {
    conditions: ['browser'],
  },
})
