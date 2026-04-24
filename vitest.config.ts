/**
 * @file Vitest Configuration
 * @description Test runner configuration for unit and integration tests.
 *
 * - Loads .env.test so integration tests connect to the test database
 * - Uses jsdom environment for component tests
 * - Path aliases mirror tsconfig so @/ imports resolve correctly
 * - Separates unit and integration test discovery patterns
 */

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom to simulate browser environment for component tests
    environment: "jsdom",

    restoreMocks: true,
    isolate: true,

    // Load test environment variables
    env: {
      NODE_ENV: "test",
    },

    // Runs before each test file — sets up jest-dom matchers and global mocks
    setupFiles: ["./tests/helpers/setup.ts"],

    // Glob patterns for test file discovery
    include: [
      "tests/unit/**/*.test.{ts,tsx}",
      "tests/integration/**/*.test.{ts,tsx}",
    ],

    // Exclude E2E tests (Playwright handles those separately)
    exclude: ["tests/e2e/**", "node_modules/**"],

    // Global test utilities (describe, it, expect) without importing
    globals: true,

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: [
        "src/lib/**/*.ts",
        "src/components/forms/**/*.tsx",
        "src/components/shared/**/*.tsx",
      ],
      exclude: [
        "src/generated/**",
        "src/lib/db.ts",
        "src/lib/auth.ts",
        "src/lib/ai.ts",
        "src/lib/chapa.ts",
        "src/lib/email.ts",
        "src/lib/resend-email.ts",
        "src/lib/email-service.ts",
        "**/*.d.ts",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
