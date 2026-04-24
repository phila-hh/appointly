/**
 * @file Vitest Configuration
 * @description Test runner configuration for unit and integration tests.
 *
 * - Loads .env.test so integration tests connect to the test database
 * - Unit tests use jsdom environment for component tests
 * - Integration tests use node environment and run sequentially
 * - Path aliases mirror tsconfig so @/ imports resolve correctly
 */

import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  // Load .env.test when running in test mode
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    test: {
      // Global test utilities (describe, it, expect) without importing
      globals: true,

      restoreMocks: true,
      isolate: true,

      // Load test environment variables
      env: {
        NODE_ENV: "test",
        ...env,
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

      // Per-project configuration — unit tests use jsdom, integration use node
      projects: [
        {
          test: {
            name: "unit",
            environment: "jsdom",
            globals: true,
            include: ["tests/unit/**/*.test.{ts,tsx}"],
            setupFiles: ["./tests/helpers/setup.ts"],
            alias: {
              "@": path.resolve(__dirname, "./src"),
            },
          },
        },
        {
          test: {
            name: "integration",
            environment: "node",
            include: ["tests/integration/**/*.test.{ts,tsx}"],
            setupFiles: ["./tests/integration/helpers/setup.ts"],
            // Run integration tests sequentially — shared DB, no parallel writes
            fileParallelism: false,
            // Force Vite to treat next-auth as CJS, preventing ESM bare-specifier errors
            server: {
              deps: {
                inline: ["next-auth", "next"],
              },
            },
          },
          resolve: {
            alias: {
              "@": path.resolve(__dirname, "./src"),
            },
            conditions: ["node", "require", "default"],
          },
        },
      ],
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
