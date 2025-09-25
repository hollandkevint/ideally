/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', 'dist', '.next'],
    globals: true,
    css: false,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'https://lbnhfsocxbwhbvnfpjdw.supabase.co',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'sb_publishable_oP6QeCDTVx4FTOh3m1nZZg_CiUNi0qy',
      NEXT_PUBLIC_GOOGLE_CLIENT_ID: '468110317941-p64sv41m8vnsc4gd503o1h1tv9mj9gv6.apps.googleusercontent.com',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000'
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
      '~': resolve(__dirname, '.')
    }
  },
  esbuild: {
    target: 'node18'
  },
  define: {
    'import.meta.vitest': 'undefined',
  }
})